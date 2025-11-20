import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  TrendingUp,
  Heart,
  MessageCircle,
  FileText,
  Share2,
  Shield,
  Clock,
  Stethoscope,
  CheckCircle,
  Star,
  Activity,
  Target,
  BarChart3,
  BookOpen,
  Users,
  ArrowRight,
  Video,
  GraduationCap,
  Brain,
  Zap,
  Loader2,
  AlertCircle,
  Send,
  Plus,
  ChevronLeft,
  ChevronRight,
  User,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../contexts/UserViewContext'
import { clinicalReportService, ClinicalReport } from '../lib/clinicalReportService'
import { supabase } from '../lib/supabase'
import ShareReportModal from '../components/ShareReportModal'
import PatientSidebar from '../components/PatientSidebar'
import NoaAnimatedAvatar from '../components/NoaAnimatedAvatar'
import NoaConversationalInterface from '../components/NoaConversationalInterface'
import { useNoaPlatform } from '../contexts/NoaPlatformContext'
import {
  backgroundGradient,
  headerGradient,
  surfaceStyle,
  secondarySurfaceStyle,
  cardStyle,
  accentGradient,
  secondaryGradient,
  goldenGradient
} from '../constants/designSystem'

interface Appointment {
  id: string
  date: string
  time: string
  professional: string
  type: string
  status: 'scheduled' | 'completed' | 'cancelled'
}

interface TherapeuticPlan {
  id: string
  title: string
  progress: number
  medications: Array<{ name: string; dosage: string; frequency: string }>
  nextReview: string
}

interface PatientPrescriptionSummary {
  id: string
  title: string
  rationality: string | null
  dosage: string | null
  frequency: string | null
  status: 'draft' | 'active' | 'completed' | 'suspended' | 'cancelled'
  issuedAt: string
  startsAt: string | null
  endsAt: string | null
  professionalName: string | null
  planTitle: string | null
}

type ResourceType = 'video' | 'article' | 'document' | 'webinar' | 'audio' | 'other'

interface EducationalResource {
  id: string
  title: string
  description: string | null
  category: string | null
  resourceType: ResourceType
  url: string | null
  publishedAt: string | null
  audience?: string | null
  allowedRoles?: string[] | null
  allowedAxes?: string[] | null
  visibilityScope?: string | null
}

const RATIONALITY_LABELS: Record<string, string> = {
  biomedical: 'Biomédica',
  traditional_chinese: 'Medicina Tradicional Chinesa',
  ayurvedic: 'Ayurvédica',
  homeopathic: 'Homeopática',
  integrativa: 'Integrativa'
}

const RESOURCE_TYPE_VISUALS: Record<ResourceType, { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  video: { label: 'Vídeo', icon: Video, accent: 'text-primary-300' },
  article: { label: 'Artigo', icon: FileText, accent: 'text-emerald-300' },
  document: { label: 'Documento', icon: FileText, accent: 'text-sky-300' },
  webinar: { label: 'Webinar', icon: Calendar, accent: 'text-amber-300' },
  audio: { label: 'Áudio', icon: MessageCircle, accent: 'text-purple-300' },
  other: { label: 'Recurso', icon: BookOpen, accent: 'text-slate-300' }
}

const DEFAULT_PROFESSIONAL_EMAILS = ['rrvalenca@gmail.com', 'eduardoscfaveret@gmail.com']

const availableProfessionals = [
  {
    id: 'eduardo-faveret',
    name: 'Dr. Eduardo Faveret',
    role: 'Neurologista Pediátrico',
    rating: '4.9',
    excerpt: 'Especialista em Epilepsia e Cannabis Medicinal. Atendimento personalizado com metodologia AEC.',
    accentClasses: 'bg-emerald-500/20 text-emerald-300',
    buttonClasses: 'bg-emerald-500 hover:bg-emerald-400',
    navigateTo: '/app/clinica/paciente/agendamentos?professional=eduardo-faveret'
  },
  {
    id: 'ricardo-valenca',
    name: 'Dr. Ricardo Valença',
    role: 'Administrador • Especialista',
    rating: '5.0',
    excerpt: 'Coordenador científico. Especialista em Arte da Entrevista Clínica e metodologia IMRE.',
    accentClasses: 'bg-primary-500/20 text-primary-300',
    buttonClasses: 'bg-primary-500 hover:bg-primary-400',
    navigateTo: '/app/clinica/paciente/agendamentos?professional=ricardo-valenca'
  }
]

const BASIC_COURSE_HIGHLIGHTS = [
  {
    id: 'module-foundations',
    title: 'Módulo 1 • Fundamentos Clínicos',
    description: 'Bases científicas da prescrição canabinoide no contexto nefrológico.',
    icon: Heart,
    accent: 'text-emerald-300',
    badge: 'Pós-graduação • Dr. Eduardo Faveret'
  },
  {
    id: 'module-neuro',
    title: 'Módulo 2 • Neurociência e Sistemas Endocanabinoides',
    description: 'Integração entre neurofisiologia, prática clínica e evidências.',
    icon: Brain,
    accent: 'text-sky-300',
    badge: 'Módulo básico do curso'
  },
  {
    id: 'module-integrative',
    title: 'Módulo 3 • Protocolos Integrativos',
    description: 'Estratégias terapêuticas alinhadas ao plano de cuidado personalizado.',
    icon: Activity,
    accent: 'text-amber-300',
    badge: 'Metodologia AEC'
  }
]

const BASIC_MODULE_SNIPPETS = [
  {
    id: 'snippet-endocannabinoid',
    title: 'Como o sistema endocanabinoide protege seus rins',
    summary:
      'Explique ao paciente como os receptores CB1 e CB2 atuam no equilíbrio inflamatório e porque ajustes de dose são personalizados.',
    tag: 'Pós-graduação Dr. Faveret',
    quiz: {
      question: 'Qual é o principal papel dos receptores CB2 na proteção renal?',
      options: [
        { id: 'A', label: 'Estimular retenção hídrica para manter a filtração glomerular.' },
        { id: 'B', label: 'Modular processos inflamatórios e fibrose, favorecendo reparo tecidual.' },
        { id: 'C', label: 'Aumentar diretamente a pressão arterial sistêmica.' },
        { id: 'D', label: 'Impedir a ação dos receptores CB1 na microcirculação renal.' }
      ],
      correctOptionId: 'B',
      aiFeedback: {
        correct:
          'Excelente! Você identificou que o CB2 atua como modulador anti-inflamatório, algo que seus rins agradecem durante o tratamento.',
        incorrect:
          'Quase lá. Lembre que o CB2 é nosso aliado quando precisamos controlar inflamação e fibrose nos néfrons. Vamos seguir juntos!'
      }
    }
  },
  {
    id: 'snippet-safe-protocols',
    title: 'Protocolos seguros no início do tratamento',
    summary:
      'Descrições claras sobre titulação lenta, acompanhamento laboratorial e sinais de atenção compartilhados com a equipe clínica.',
    tag: 'Plano terapêutico',
    quiz: {
      question: 'Por que recomendamos titulação lenta na primeira fase do uso de canabinoides?',
      options: [
        { id: 'A', label: 'Para encurtar o tempo total de tratamento.' },
        { id: 'B', label: 'Para identificar a menor dose eficaz e monitorar tolerabilidade.' },
        { id: 'C', label: 'Para evitar a necessidade de exames laboratoriais.' },
        { id: 'D', label: 'Para reduzir a adesão do paciente e testar sua disciplina.' }
      ],
      correctOptionId: 'B',
      aiFeedback: {
        correct:
          'Perfeito! Titulação lenta significa personalização segura: achamos a dose ótima enquanto cuidamos dos marcadores clínicos.',
        incorrect:
          'Vamos retomar: titulação lenta permite ajustar a dose com segurança, com base em sintomas e exames. Continuamos juntos!'
      }
    }
  },
  {
    id: 'snippet-communication',
    title: '3 princípios para comunicar o seu cuidado',
    summary:
      'Semiose infinita (seu sentido evolui com cada consulta), economia política do significante (suas palavras têm valor) e heterogeneidade enunciativa (seu histórico importa).',
    tag: 'Arte da Entrevista Clínica',
    quiz: {
      question: 'Qual princípio reforça que cada paciente traz múltiplas vozes e contextos à consulta?',
      options: [
        { id: 'A', label: 'Semiose infinita' },
        { id: 'B', label: 'Economia política do significante' },
        { id: 'C', label: 'Heterogeneidade enunciativa' },
        { id: 'D', label: 'Ressonância simbólica' }
      ],
      correctOptionId: 'C',
      aiFeedback: {
        correct:
          'Muito bem! Heterogeneidade enunciativa lembra que suas experiências, familiares e profissionais co-criam a narrativa clínica.',
        incorrect:
          'Boa tentativa. Experimente observar como diferentes vozes aparecem na sua história: é a heterogeneidade enunciativa em ação.'
      }
    }
  }
]

const PatientDashboard: React.FC = () => {
  const { user } = useAuth()
  const { getEffectiveUserType, isAdminViewingAs } = useUserView()
  const navigate = useNavigate()
  const { openChat, sendInitialMessage } = useNoaPlatform()

  // Se admin está visualizando como paciente
  const effectiveType = getEffectiveUserType(user?.type)
  const isViewingAsPatient = isAdminViewingAs && effectiveType === 'paciente'

  // Estados
  const [reports, setReports] = useState<ClinicalReport[]>([])
  const [loadingReports, setLoadingReports] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [therapeuticPlan, setTherapeuticPlan] = useState<TherapeuticPlan | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agendamento' | 'meus-agendamentos' | 'plano' | 'conteudo' | 'chat' | 'chat-noa' | 'perfil' | 'reportar-problema'>('perfil')
  const [shouldStartAssessment, setShouldStartAssessment] = useState(false)
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [educationalResources, setEducationalResources] = useState<EducationalResource[]>([])
  const [educationalLoading, setEducationalLoading] = useState(false)
  const [educationalError, setEducationalError] = useState<string | null>(null)
  const [patientPrescriptions, setPatientPrescriptions] = useState<PatientPrescriptionSummary[]>([])
  const [patientPrescriptionsLoading, setPatientPrescriptionsLoading] = useState(false)
  const [quizResponses, setQuizResponses] = useState<Record<string, { selectedOptionId?: string; status?: 'correct' | 'incorrect' }>>({})
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareModalReportId, setShareModalReportId] = useState<string | null>(null)
  const [shareModalReportName, setShareModalReportName] = useState<string>('Relatório clínico')
  const [chatRoomId, setChatRoomId] = useState<string | null>(null)
  const [problemMessage, setProblemMessage] = useState('')
  const [sendingProblem, setSendingProblem] = useState(false)
  const [problemSent, setProblemSent] = useState(false)
  const [appointmentsViewMode, setAppointmentsViewMode] = useState<'calendar' | 'list'>('calendar')
  const [appointmentsCurrentDate, setAppointmentsCurrentDate] = useState(new Date())
  const [appointmentsSelectedDate, setAppointmentsSelectedDate] = useState<Date | null>(null)
  const [appointmentsSelectedTime, setAppointmentsSelectedTime] = useState<string | null>(null)

  const normalizeAccessList = (raw: unknown): string[] | null => {
    if (!raw) return null
    if (Array.isArray(raw)) {
      return raw.map(item => String(item).toLowerCase().trim()).filter(Boolean)
    }
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (!trimmed.length) return null
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map(item => String(item).toLowerCase().trim()).filter(Boolean)
        }
      } catch (err) {
        // not JSON, fallback to comma-separated string
      }
      return trimmed
        .split(/[;,]/)
        .map(item => item.trim().toLowerCase())
        .filter(Boolean)
    }
    return null
  }

  const matchesRolePermission = (roles: string[] | null, effectiveRole: string): boolean => {
    if (!roles || roles.length === 0) return true
    const roleToken = effectiveRole.toLowerCase()
    return roles.some(role => [roleToken, 'all', 'global', 'public', 'paciente', 'patient'].includes(role))
  }

  const matchesAxisPermission = (axes: string[] | null): boolean => {
    if (!axes || axes.length === 0) return true
    const clinicTokens = ['clinica', 'clínica', 'clinical', 'clinical-care', 'eixo-clinica']
    return axes.some(axis => clinicTokens.includes(axis))
  }

  const availableProfessionals = [
    {
      id: 'eduardo-faveret',
      name: 'Dr. Eduardo Faveret',
      role: 'Neurologista Pediátrico',
      rating: '4.9',
      excerpt: 'Especialista em Epilepsia e Cannabis Medicinal. Atendimento personalizado com metodologia AEC.',
      accentClasses: 'bg-emerald-500/20 text-emerald-300',
      buttonClasses: 'bg-emerald-500 hover:bg-emerald-400',
      navigateTo: '/app/clinica/paciente/agendamentos?professional=eduardo-faveret'
    },
    {
      id: 'ricardo-valenca',
      name: 'Dr. Ricardo Valença',
      role: 'Administrador • Especialista',
      rating: '5.0',
      excerpt: 'Coordenador científico. Especialista em Arte da Entrevista Clínica e metodologia IMRE.',
      accentClasses: 'bg-primary-500/20 text-primary-300',
      buttonClasses: 'bg-primary-500 hover:bg-primary-400',
      navigateTo: '/app/clinica/paciente/agendamentos?professional=ricardo-valenca'
    }
  ]

  const loadPatientData = async () => {
    if (!user?.id) return

    setLoadingReports(true)
    setPatientPrescriptionsLoading(true)

    const patientId = user.id

    try {
      const patientReports = await clinicalReportService.getPatientReports(patientId)
      setReports(patientReports)
    } catch (error) {
      console.warn('Erro ao buscar relatórios clínicos:', error)
      setReports([])
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true })
        .limit(20)

      if (error) {
        throw error
      }

      if (data && data.length) {
        setAppointments(
          data.map((apt: any) => ({
            id: apt.id,
            date: apt.appointment_date,
            time: apt.appointment_time || '09:00',
            professional: apt.professional_name || 'Equipe Clínica',
            type: apt.appointment_type || 'Consulta',
            status: apt.status || 'scheduled'
          }))
        )
      } else {
        setAppointments([])
      }
    } catch (directError) {
      console.warn('Erro ao buscar agendamentos (tabela direta), tentando visão:', directError)
      try {
        const { data: viewData, error: viewError } = await supabase
          .from('v_patient_appointments')
          .select('*')
          .eq('patient_id', patientId)
          .order('appointment_date', { ascending: true })
          .limit(20)

        if (viewError) {
          throw viewError
        }

        setAppointments(
          (viewData ?? []).map((apt: any) => ({
            id: apt.id,
            date: apt.appointment_date,
            time: apt.appointment_time || apt.start_time || '09:00',
            professional: apt.professional_name || apt.professional_full_name || 'Equipe Clínica',
            type: apt.appointment_type || apt.type || 'Consulta',
            status: apt.status || 'scheduled'
          }))
        )
      } catch (fallbackError) {
        console.warn('Falha ao buscar agendamentos via visão pública:', fallbackError)
        setAppointments([])
      }
    }

    let latestReport: any = null
    let latestAssessment: any = null

    try {
      const { data: reportData } = await supabase
        .from('clinical_reports')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)

      latestReport = reportData?.[0] ?? null
    } catch (error) {
      console.warn('Erro ao buscar último relatório clínico:', error)
    }

    try {
      const { data: assessmentData } = await supabase
        .from('clinical_assessments')
        .select('*')
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)

      latestAssessment = assessmentData?.[0] ?? null
    } catch (error) {
      console.warn('Erro ao buscar última avaliação clínica:', error)
    }

    let fallbackMedications: Array<{ name: string; dosage: string; frequency: string }> = []
    let fallbackProgress = 0
    let fallbackNextReview = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    if (latestReport?.content) {
      const content = latestReport.content as any
      if (content.plan?.medications) {
        fallbackMedications = content.plan.medications
      } else if (content.rationalities?.biomedical?.treatment) {
        const treatment = content.rationalities.biomedical.treatment
        if (typeof treatment === 'string' && treatment.includes('CBD')) {
          fallbackMedications = [{ name: 'CBD', dosage: '25mg', frequency: '2x ao dia' }]
        }
      }
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(latestReport.created_at ?? Date.now()).getTime()) / (1000 * 60 * 60 * 24)
      )
      fallbackProgress = Math.min(100, Math.max(10, daysSinceCreation))
      fallbackNextReview = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
    }

    if (latestAssessment?.follow_up_days) {
      fallbackNextReview = new Date(Date.now() + latestAssessment.follow_up_days * 24 * 60 * 60 * 1000)
    }

    try {
      const { data: planData, error: planError } = await supabase
        .from('patient_therapeutic_plans')
        .select('id, title, summary, status, started_at, completed_at')
        .eq('patient_id', patientId)
        .in('status', ['active', 'draft'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (planError) {
        console.warn('Erro ao buscar plano terapêutico do paciente:', planError)
        setTherapeuticPlan(null)
      } else if (planData) {
        setTherapeuticPlan({
          id: planData.id,
          title: planData.title ?? 'Plano terapêutico personalizado',
          progress: fallbackProgress,
          medications: fallbackMedications.length
            ? fallbackMedications
            : [
                {
                  name: 'A definir com a equipe clínica',
                  dosage: 'Sob medida',
                  frequency: 'Segundo protocolo'
                }
              ],
          nextReview: fallbackNextReview.toLocaleDateString('pt-BR')
        })
      } else {
        setTherapeuticPlan(null)
      }
    } catch (error) {
      console.warn('Erro inesperado ao processar plano terapêutico:', error)
      setTherapeuticPlan(null)
    }

    try {
      const { data: prescriptionsData, error: prescriptionsError } = await supabase
        .from('v_patient_prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('issued_at', { ascending: false })

      if (prescriptionsError) {
        console.warn('Erro ao buscar prescrições do paciente:', prescriptionsError)
        setPatientPrescriptions([])
      } else {
        setPatientPrescriptions(
          (prescriptionsData ?? []).map((row: any) => ({
            id: row.id,
            title: row.title ?? row.template_title ?? 'Prescrição integrativa',
            rationality: row.rationality ?? row.template_rationality ?? null,
            dosage: row.dosage ?? row.template_dosage ?? null,
            frequency: row.frequency ?? row.template_frequency ?? null,
            status: row.status ?? 'draft',
            issuedAt: row.issued_at,
            startsAt: row.starts_at ?? row.plan_starts_at ?? null,
            endsAt: row.ends_at ?? row.plan_ends_at ?? null,
            professionalName: row.professional_name ?? null,
            planTitle: row.plan_title ?? null
          }))
        )
      }
    } catch (error) {
      console.warn('Erro inesperado ao processar prescrições:', error)
      setPatientPrescriptions([])
    } finally {
      setLoadingReports(false)
      setPatientPrescriptionsLoading(false)
    }
  }

  const loadEducationalResources = useCallback(async () => {
    setEducationalLoading(true)
    setEducationalError(null)
    try {
      const { data, error } = await supabase
        .from('educational_resources')
        .select('id, title, summary, description, category, resource_type, url, published_at, audience, status, allowed_roles, role_permissions, allowed_axes, axis_permissions, visibility_scope')
        .order('published_at', { ascending: false })
        .limit(12)

      if (error) {
        throw error
      }

      const transformed: EducationalResource[] = (data ?? [])
        .filter(entry => {
          const rawAudience = (entry as any).audience
          const status = (entry as any).status
          const roles = normalizeAccessList((entry as any).allowed_roles ?? (entry as any).role_permissions ?? rawAudience)
          const axes = normalizeAccessList((entry as any).allowed_axes ?? (entry as any).axis_permissions)
          const visibility = ((entry as any).visibility_scope ?? '').toString().toLowerCase()

          const isPublished = !status || ['published', 'ativo', 'active', 'liberado'].includes(String(status).toLowerCase())
          const roleAllowed = matchesRolePermission(roles, 'patient')
          const axisAllowed = matchesAxisPermission(axes)
          const visibilityAllowed = !visibility || !['admin-only', 'professional-only'].includes(visibility)

          return isPublished && roleAllowed && axisAllowed && visibilityAllowed
        })
        .map(entry => {
          const rawAudience = (entry as any).audience ?? null
          const resourceTypeRaw = (entry as any).resource_type
          const resourceType = resourceTypeRaw && resourceTypeRaw in RESOURCE_TYPE_VISUALS ? (resourceTypeRaw as ResourceType) : 'other'
          return {
            id: String((entry as any).id),
            title: (entry as any).title ?? 'Recurso educacional',
            description: (entry as any).description ?? (entry as any).summary ?? null,
            category: (entry as any).category ?? null,
            resourceType,
            url: (entry as any).url ?? null,
            publishedAt: (entry as any).published_at ?? null,
            audience: rawAudience ?? null,
            allowedRoles: normalizeAccessList((entry as any).allowed_roles ?? (entry as any).role_permissions ?? rawAudience),
            allowedAxes: normalizeAccessList((entry as any).allowed_axes ?? (entry as any).axis_permissions),
            visibilityScope: ((entry as any).visibility_scope ?? null) as string | null
          }
        })

      setEducationalResources(transformed)
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error ? (error as any).code : null
      if (code === 'PGRST205') {
        // Tabela/visão ainda não existente no ambiente: tratar como ausência de conteúdo.
        setEducationalResources([])
        setEducationalError(null)
      } else {
        console.warn('Falha ao carregar conteúdo educacional:', error)
        setEducationalResources([])
        setEducationalError('Não foi possível carregar os recursos educacionais neste momento.')
      }
    } finally {
      setEducationalLoading(false)
    }
  }, [])

  // Abrir chat NOA automaticamente quando a tab chat-noa for ativada
  useEffect(() => {
    if (activeTab === 'chat-noa') {
      // Aguardar um pouco para garantir que o componente esteja renderizado
      setTimeout(() => {
        openChat()
        
        // Se deve iniciar avaliação, enviar mensagem inicial
        if (shouldStartAssessment) {
          setTimeout(() => {
            sendInitialMessage('Iniciar Avaliação Clínica Inicial IMRE Triaxial. Por favor, inicie o protocolo IMRE para minha avaliação clínica inicial.')
          }, 1000)
          setShouldStartAssessment(false)
        }
      }, 300)
    }
  }, [activeTab, shouldStartAssessment, openChat, sendInitialMessage])

  // Carregar dados do paciente
  useEffect(() => {
    if (user?.id) {
      loadPatientData()
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    void loadEducationalResources()
  }, [user?.id, loadEducationalResources])

  // Função para agendar consulta
  const handleCardClick = (cardId: string) => {
    setActiveCard(cardId)
  }

  const handleScheduleAppointment = () => {
    setActiveTab('agendamento')
    setActiveCard('agendar-consulta')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenPlan = () => {
    setActiveTab('plano')
    setActiveCard('plano-terapeutico')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewEducational = () => {
    setActiveTab('conteudo')
    setActiveCard('conteudo-educacional')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewAppointments = () => {
    setActiveTab('meus-agendamentos')
    setActiveCard('meus-agendamentos')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewProfile = () => {
    setActiveTab('perfil')
    setActiveCard('meu-perfil')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReportProblem = () => {
    setActiveTab('reportar-problema')
    setActiveCard('reportar-problema')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToDashboard = () => {
    setActiveTab('dashboard')
    setActiveCard(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenChat = async () => {
    if (!user?.id) return

    if (isViewingAsPatient) {
      navigate('/app/clinica/paciente/chat-profissional?origin=patient-dashboard')
      return
    }

    setChatLoading(true)
    try {
      let targetRoomId: string | undefined

      const { data: existingRooms, error: existingError } = await supabase
        .from('chat_participants')
        .select('room_id, chat_rooms!inner(id, type)')
        .eq('user_id', user.id)
        .eq('chat_rooms.type', 'patient')
        .limit(1)

      if (!existingError && existingRooms?.length) {
        targetRoomId = existingRooms[0].room_id
      } else {
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert({
            name: user.name ? `Canal de cuidado • ${user.name}` : 'Canal do paciente',
            type: 'patient',
            created_by: user.id
          })
          .select('id')
          .single()

        if (roomError || !newRoom) {
          throw roomError ?? new Error('Não foi possível criar o canal do paciente')
        }

        targetRoomId = newRoom.id

        const { data: professionals } = await supabase
          .from('users_compatible')
          .select('id')
          .in('email', DEFAULT_PROFESSIONAL_EMAILS)

        const professionalIds = (professionals ?? [])
          .map(profile => profile.id)
          .filter((id): id is string => Boolean(id))

        const participantsPayload = [
          { room_id: newRoom.id, user_id: user.id, role: 'patient' },
          ...professionalIds.map(proId => ({
            room_id: newRoom.id,
            user_id: proId,
            role: 'professional'
          }))
        ]

        if (participantsPayload.length) {
          await supabase
            .from('chat_participants')
            .upsert(participantsPayload, { onConflict: 'room_id,user_id' })
        }
      }

      setChatRoomId(targetRoomId || null)
      setActiveTab('chat')
      setActiveCard('chat-medico')
    } catch (error) {
      console.error('Erro ao preparar canal de chat do paciente:', error)
      navigate('/app/clinica/paciente/chat-profissional?origin=patient-dashboard')
    } finally {
      setChatLoading(false)
    }
  }

  const handleSelectQuizOption = (snippetId: string, optionId: string) => {
    setQuizResponses(prev => ({
      ...prev,
      [snippetId]: {
        selectedOptionId: optionId,
        status: undefined
      }
    }))
  }

  const handleSubmitQuiz = (snippetId: string) => {
    const snippet = BASIC_MODULE_SNIPPETS.find(item => item.id === snippetId)
    if (!snippet?.quiz) return
    const selected = quizResponses[snippetId]?.selectedOptionId
    if (!selected) return
    const isCorrect = selected === snippet.quiz.correctOptionId
    setQuizResponses(prev => ({
      ...prev,
      [snippetId]: {
        ...prev[snippetId],
        status: isCorrect ? 'correct' : 'incorrect'
      }
    }))
  }

  const latestClinicalReport = reports.length ? reports[0] : null

  const getReportStatusLabel = (status: ClinicalReport['status']) => {
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

  const handleShareReport = (report: ClinicalReport) => {
    setShareModalReportId(report.id)
    const readableName =
      report.report_type === 'initial_assessment'
        ? 'Avaliação clínica inicial'
        : report.report_type === 'follow_up'
          ? 'Relatório de acompanhamento'
          : 'Relatório clínico'
    setShareModalReportName(readableName)
    setShareModalOpen(true)
  }

  const handleSendProblem = async () => {
    if (!problemMessage.trim() || !user?.id) return

    setSendingProblem(true)
    try {
      // Buscar admins
      const { data: admins } = await supabase
        .from('users_compatible')
        .select('id, email, name')
        .eq('type', 'admin')
        .limit(10)

      if (!admins || admins.length === 0) {
        throw new Error('Nenhum administrador encontrado')
      }

      // Criar ou encontrar sala de chat com admins
      let adminRoomId: string | undefined

      // Tentar encontrar sala existente
      const { data: existingRooms } = await supabase
        .from('chat_participants')
        .select('room_id, chat_rooms!inner(id, type)')
        .eq('user_id', user.id)
        .eq('chat_rooms.type', 'admin-support')
        .limit(1)

      if (existingRooms && existingRooms.length > 0) {
        adminRoomId = existingRooms[0].room_id
      } else {
        // Criar nova sala
        const { data: newRoom, error: roomError } = await supabase
          .from('chat_rooms')
          .insert({
            name: `Suporte • ${user.name || 'Paciente'}`,
            type: 'admin-support',
            created_by: user.id
          })
          .select('id')
          .single()

        if (roomError || !newRoom) {
          throw roomError ?? new Error('Não foi possível criar sala de suporte')
        }

        adminRoomId = newRoom.id

        // Adicionar paciente e admins como participantes
        const participantsPayload = [
          { room_id: adminRoomId, user_id: user.id, role: 'patient' },
          ...admins.map(admin => ({
            room_id: adminRoomId,
            user_id: admin.id,
            role: 'admin'
          }))
        ]

        await supabase
          .from('chat_participants')
          .upsert(participantsPayload, { onConflict: 'room_id,user_id' })
      }

      // Enviar mensagem
      if (adminRoomId) {
        await supabase
          .from('chat_messages')
          .insert({
            room_id: adminRoomId,
            user_id: user.id,
            content: problemMessage.trim(),
            message_type: 'text'
          })

        setProblemSent(true)
        setProblemMessage('')
        
        // Navegar para o chat após 2 segundos
        setTimeout(() => {
          setActiveTab('chat')
          setActiveCard('chat-medico')
          navigate(`/app/clinica/paciente/chat-profissional?roomId=${adminRoomId}&origin=patient-dashboard`)
        }, 2000)
      }
    } catch (error) {
      console.error('Erro ao enviar problema:', error)
      alert('Erro ao enviar mensagem. Tente novamente.')
    } finally {
      setSendingProblem(false)
    }
  }

  // Renderizar Chat com Médico
  const renderChat = () => {
    if (chatLoading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-300 mx-auto mb-4" />
            <p className="text-slate-400">Carregando chat...</p>
          </div>
        </div>
      )
    }

    const chatUrl = chatRoomId
      ? `/app/clinica/paciente/chat-profissional?origin=patient-dashboard&roomId=${chatRoomId}&embed=true`
      : '/app/clinica/paciente/chat-profissional?origin=patient-dashboard&embed=true'

    return (
      <div className="h-full flex flex-col p-4 items-center" style={{ paddingTop: '2%', paddingBottom: '12%' }}>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden w-full" style={{ height: '80%', maxHeight: '80%' }}>
          <iframe
            src={chatUrl}
            className="w-full h-full border-0"
            title="Chat com Médico"
            style={{ backgroundColor: 'transparent' }}
          />
        </div>
      </div>
    )
  }

  // Renderizar Chat com Nôa (Avaliação Inicial)
  const renderChatNoa = () => {
    return (
      <div className="h-full w-full flex flex-col bg-slate-900 overflow-hidden">
        {/* Avatar da Nôa Residente AI */}
        <div className="bg-slate-800 rounded-xl p-4 md:p-6 flex flex-col items-center mb-4 md:mb-6 flex-shrink-0">
          <div className="text-center mb-4">
            <h3 className="text-lg md:text-xl font-semibold text-white mb-1">Nôa Esperança</h3>
            <p className="text-xs text-slate-400">IA Residente - Especializada em Avaliações Clínicas</p>
          </div>
          
          <div className="flex justify-center mb-4">
            <NoaAnimatedAvatar
              size="lg"
              showStatus={true}
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-slate-300 mb-2">
              🌬️ Bons ventos sóprem! Sou Nôa Esperança, sua IA Residente.
            </p>
            <p className="text-xs text-slate-400 mb-2">
              Especializada em avaliações clínicas e treinamentos
            </p>
            <p className="text-xs text-blue-400">
              💬 Clique no botão de chat no canto inferior direito para começar a conversar comigo!
            </p>
          </div>
        </div>

        {/* Interface Conversacional - Expandida */}
        <div className="flex-1 min-h-0 relative">
          <NoaConversationalInterface 
            userName={user?.name || 'Paciente'}
            userCode={user?.id || 'PATIENT-001'}
            position="bottom-right"
            hideButton={false}
          />
        </div>
      </div>
    )
  }

  // Renderizar Meus Agendamentos
  const renderMeusAgendamentos = () => {

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

    // Gerar dias do calendário
    const generateCalendarDays = () => {
      const year = appointmentsCurrentDate.getFullYear()
      const month = appointmentsCurrentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()
      const startingDay = firstDay.getDay()

      const days = []
      
      // Dias do mês anterior
      for (let i = startingDay - 1; i >= 0; i--) {
        const prevMonth = new Date(year, month - 1, 0)
        prevMonth.setHours(0, 0, 0, 0)
        const fullDate = new Date(year, month - 1, prevMonth.getDate() - i)
        fullDate.setHours(0, 0, 0, 0)
        days.push({
          date: fullDate.getDate(),
          fullDate,
          isCurrentMonth: false,
          isToday: false,
          isDisabled: true
        })
      }

      // Dias do mês atual
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        date.setHours(0, 0, 0, 0)
        const isToday = date.toDateString() === new Date().toDateString()
        
        days.push({
          date: day,
          fullDate: date,
          isCurrentMonth: true,
          isToday,
          isDisabled: false
        })
      }

      // Dias do próximo mês
      const remainingDays = 42 - days.length
      for (let day = 1; day <= remainingDays; day++) {
        const fullDate = new Date(year, month + 1, day)
        fullDate.setHours(0, 0, 0, 0)
        days.push({
          date: fullDate.getDate(),
          fullDate,
          isCurrentMonth: false,
          isToday: false,
          isDisabled: true
        })
      }

      return days
    }

    const navigateMonth = (direction: 'prev' | 'next') => {
      setAppointmentsCurrentDate(prev => {
        const newDate = new Date(prev)
        if (direction === 'prev') {
          newDate.setMonth(newDate.getMonth() - 1)
        } else {
          newDate.setMonth(newDate.getMonth() + 1)
        }
        newDate.setDate(1)
        newDate.setHours(0, 0, 0, 0)
        return newDate
      })
    }

    const handleDateSelect = (day: any) => {
      if (day.isCurrentMonth && !day.isDisabled) {
        setAppointmentsSelectedDate(new Date(day.fullDate))
        setAppointmentsSelectedTime(null)
      }
    }

    const calendarDays = generateCalendarDays()
    const availableTimes = ['14:00', '15:15', '16:30', '17:45', '19:00']

    return (
      <div className="space-y-6 w-full">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Meus Agendamentos</h1>
          <p className="text-slate-300 text-sm md:text-base">
            Gerencie suas consultas e visualize seu calendário integrado ao seu plano de cuidado
          </p>
        </div>

        {/* Toggle Calendário/Lista */}
        <div className="flex gap-2">
          <button
            onClick={() => setAppointmentsViewMode('calendar')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              appointmentsViewMode === 'calendar'
                ? 'bg-primary-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Calendário
          </button>
          <button
            onClick={() => setAppointmentsViewMode('list')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              appointmentsViewMode === 'list'
                ? 'bg-primary-500 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Lista
          </button>
        </div>

        {/* Jornada de Cuidado */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-primary-300" />
            Sua Jornada de Cuidado
          </h2>
          <p className="text-slate-300 text-sm">
            Para garantir o melhor atendimento, seguimos uma jornada estruturada que começa com sua avaliação clínica inicial.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Passo 1 */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-300 font-bold text-sm">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary-300" />
                    Avaliação Clínica Inicial
                  </h3>
                  <p className="text-slate-300 text-xs mb-3">
                    Realize uma avaliação clínica completa com a IA Residente Nôa Esperança usando o protocolo IMRE. Esta avaliação é privada e confidencial - apenas você pode ver o conteúdo completo do relatório.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab('chat-noa')
                      setActiveCard(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="text-xs px-3 py-1.5 bg-primary-500 hover:bg-primary-400 text-white rounded-lg font-semibold transition-colors"
                  >
                    Iniciar Avaliação Clínica
                  </button>
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-300 font-bold text-sm">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-300" />
                    Relatório Gerado
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Após a avaliação, a IA gera um relatório clínico completo que fica disponível no seu histórico de saúde. Você controla o compartilhamento - o médico não recebe automaticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-300 font-bold text-sm">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-300" />
                    Compartilhamento Seguro
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Quando você agendar uma consulta, você pode opcionalmente compartilhar o relatório com o profissional. O médico saberá que um relatório existe, mas só verá o conteúdo se você compartilhar explicitamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-300 font-bold text-sm">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-300" />
                    Agendar Consulta
                  </h3>
                  <p className="text-slate-300 text-xs">
                    Após a avaliação, agende sua consulta com os profissionais da plataforma. Todas as suas consultas ficam integradas ao seu plano de cuidado personalizado.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-500/10 border border-primary-500/30 rounded-lg p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary-300 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-primary-200 text-xs font-semibold mb-1">Segurança de Dados</p>
              <p className="text-slate-300 text-xs">
                Todos os seus dados são protegidos por sigilo médico e LGPD. Você tem controle total sobre o compartilhamento do seu relatório de avaliação clínica.
              </p>
            </div>
          </div>
        </div>

        {/* Próximas Consultas */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-300" />
              Próximas Consultas
            </h2>
            <button
              onClick={handleScheduleAppointment}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-400 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agendar nova consulta
            </button>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 3).map(appointment => (
                <div
                  key={appointment.id}
                  className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 border border-primary-500/40 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-300" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{appointment.professional}</p>
                      <p className="text-slate-300 text-sm">
                        {new Date(appointment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {appointment.time}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    appointment.status === 'scheduled'
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                      : 'bg-blue-500/10 text-blue-300 border border-blue-500/40'
                  }`}>
                    {appointment.status === 'scheduled' ? 'Agendada' : 'Concluída'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-slate-700 rounded-xl py-12 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-800 border border-slate-700 mx-auto">
                <Calendar className="w-6 h-6 text-slate-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-4">Nenhuma consulta agendada</p>
                <p className="text-slate-500 text-xs mb-4">Suas consultas estarão integradas ao seu plano de cuidado personalizado</p>
                <button
                  onClick={handleScheduleAppointment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-500/40 text-primary-300 hover:bg-primary-500/10 transition-colors text-sm font-semibold"
                >
                  Agendar sua primeira consulta
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Calendário */}
        {appointmentsViewMode === 'calendar' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">
                {monthNames[appointmentsCurrentDate.getMonth()]} {appointmentsCurrentDate.getFullYear()}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-1">
              {dayNames.map(day => (
                <div key={day} className="p-2 text-center text-xs font-medium text-slate-400">
                  {day}
                </div>
              ))}
            </div>

            {/* Dias do calendário */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDateSelect(day)}
                  disabled={day.isDisabled}
                  className={`p-2 rounded-lg text-sm transition-colors ${
                    day.isDisabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : day.isToday
                      ? 'bg-primary-500/20 text-primary-300 border border-primary-500/40'
                      : appointmentsSelectedDate && day.fullDate.toDateString() === appointmentsSelectedDate.toDateString()
                      ? 'bg-primary-500 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  } ${!day.isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  {day.date}
                </button>
              ))}
            </div>

            {/* Horários disponíveis */}
            {appointmentsSelectedDate && (
              <div className="border-t border-slate-800 pt-6">
                <h4 className="text-sm font-semibold text-white mb-4">
                  Horários Disponíveis - {appointmentsSelectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {availableTimes.map(time => (
                    <button
                      key={time}
                      onClick={() => {
                        setAppointmentsSelectedTime(time)
                        handleScheduleAppointment()
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        appointmentsSelectedTime === time
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Renderizar Reportar Problema
  const renderReportProblem = () => {
    return (
      <div className="space-y-6">

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Descreva o problema ou sua mensagem
              </label>
              <textarea
                value={problemMessage}
                onChange={(e) => setProblemMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui... (máximo 500 caracteres)"
                maxLength={500}
                rows={6}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 text-sm px-4 py-3 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/40 resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-slate-400">
                  Sua mensagem será enviada diretamente para os administradores
                </p>
                <p className="text-xs text-slate-500">
                  {problemMessage.length}/500 caracteres
                </p>
              </div>
            </div>

            {problemSent && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <p className="text-sm text-emerald-300">
                  Mensagem enviada com sucesso! A equipe de suporte responderá em breve.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSendProblem}
                disabled={!problemMessage.trim() || sendingProblem || problemSent}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingProblem ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : problemSent ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Enviado!
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar Mensagem
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setProblemMessage('')
                  setProblemSent(false)
                }}
                disabled={sendingProblem}
                className="px-6 py-3 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white font-semibold transition-colors disabled:opacity-50"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Informações Importantes
          </h3>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">1</span>
              </div>
              <p>
                <strong className="text-white">Resposta rápida:</strong> A equipe de suporte geralmente responde em até 24 horas.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">2</span>
              </div>
              <p>
                <strong className="text-white">Mensagens curtas:</strong> Seja objetivo e descreva o problema de forma clara.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-400 text-xs font-bold">3</span>
              </div>
              <p>
                <strong className="text-white">Acompanhamento:</strong> Você pode acompanhar a conversa na seção "Chat com Médico" após o envio.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar Meu Perfil com Analytics
  const renderPerfil = () => {
    // Calcular estatísticas
    const totalConsultas = appointments.length
    const consultasAgendadas = appointments.filter(apt => apt.status === 'scheduled').length
    const consultasConcluidas = appointments.filter(apt => apt.status === 'completed').length
    const totalPrescricoes = patientPrescriptions.length
    const prescricoesAtivas = activePrescriptions.length
    const totalRelatorios = reports.length
    const totalRecursosEducacionais = educationalResources.length
    const progressoPlano = therapeuticPlan?.progress || 0
    
    // Rationality chips para exibição
    const rationalityChips = Array.from(
      new Set(
        patientPrescriptions
          .map(prescription =>
            prescription.rationality && RATIONALITY_LABELS[prescription.rationality]
              ? RATIONALITY_LABELS[prescription.rationality]
              : null
          )
          .filter((label): label is string => Boolean(label))
      )
    ).slice(0, 3)

    // Calcular dias desde o primeiro acesso
    const primeiroAcesso = reports.length > 0 
      ? new Date(reports.sort((a, b) => new Date(a.generated_at || 0).getTime() - new Date(b.generated_at || 0).getTime())[0].generated_at || Date.now())
      : appointments.length > 0
        ? new Date(appointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date)
        : new Date()
    const diasNoPlataforma = Math.max(0, Math.floor((Date.now() - primeiroAcesso.getTime()) / (1000 * 60 * 60 * 24)))

    return (
      <div className="space-y-6">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Dias na Plataforma */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-9 h-9 text-indigo-300" />
              <span className="text-3xl font-bold text-white">{diasNoPlataforma}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Dias na Plataforma</h3>
            <p className="text-base text-slate-400">Tempo de uso do sistema</p>
          </div>

          {/* Consultas */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-9 h-9 text-primary-300" />
              <span className="text-3xl font-bold text-white">{totalConsultas}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Consultas</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Agendadas:</span>
                <span className="text-emerald-400">{consultasAgendadas}</span>
              </div>
              <div className="flex justify-between">
                <span>Concluídas:</span>
                <span className="text-blue-400">{consultasConcluidas}</span>
              </div>
            </div>
          </div>

          {/* Prescrições */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Heart className="w-9 h-9 text-emerald-300" />
              <span className="text-3xl font-bold text-white">{totalPrescricoes}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Prescrições</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Ativas:</span>
                <span className="text-emerald-400">{prescricoesAtivas}</span>
              </div>
              <div className="flex justify-between">
                <span>Total:</span>
                <span className="text-slate-300">{totalPrescricoes}</span>
              </div>
            </div>
          </div>

          {/* Relatórios */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-9 h-9 text-purple-300" />
              <span className="text-3xl font-bold text-white">{totalRelatorios}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Relatórios Clínicos</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Gerados:</span>
                <span className="text-purple-400">{totalRelatorios}</span>
              </div>
              {latestClinicalReport && (
                <div className="flex justify-between">
                  <span>Último:</span>
                  <span className="text-slate-300">
                    {latestClinicalReport.generated_at 
                      ? new Date(latestClinicalReport.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                      : 'N/A'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recursos Educacionais */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="w-9 h-9 text-sky-300" />
              <span className="text-3xl font-bold text-white">{totalRecursosEducacionais}</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Recursos Acessados</h3>
            <div className="space-y-1.5 text-base text-slate-400">
              <div className="flex justify-between">
                <span>Disponíveis:</span>
                <span className="text-sky-400">{totalRecursosEducacionais}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progresso do Plano Terapêutico */}
        {therapeuticPlan && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Target className="w-6 h-6 text-primary-300" />
                Progresso do Plano Terapêutico
              </h3>
              <span className="text-2xl font-bold text-primary-300">{progressoPlano}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800">
              <div
                className="h-3 rounded-full transition-all bg-gradient-to-r from-primary-500 to-emerald-500"
                style={{ width: `${progressoPlano}%` }}
              />
            </div>
            <p className="text-base text-slate-400 mt-2">{therapeuticPlan.title}</p>
          </div>
        )}

        {/* Analytics de Uso */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-6 h-6 text-primary-300" />
            Analytics de Uso
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Engajamento */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-6 h-6 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">Engajamento</h4>
              </div>
              <div className="space-y-2 text-base">
                <div className="flex justify-between text-slate-300">
                  <span>Consultas realizadas:</span>
                  <span className="font-semibold text-white">{consultasConcluidas}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Prescrições ativas:</span>
                  <span className="font-semibold text-white">{prescricoesAtivas}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Recursos acessados:</span>
                  <span className="font-semibold text-white">{totalRecursosEducacionais}</span>
                </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
                <h4 className="text-base font-semibold text-white">Atividade Recente</h4>
              </div>
              <div className="space-y-2 text-base">
                {latestClinicalReport && (
                  <div className="flex justify-between text-slate-300">
                    <span>Último relatório:</span>
                    <span className="font-semibold text-white">
                      {latestClinicalReport.generated_at 
                        ? new Date(latestClinicalReport.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {appointments.length > 0 && (
                  <div className="flex justify-between text-slate-300">
                    <span>Próxima consulta:</span>
                    <span className="font-semibold text-white">
                      {appointments
                        .filter(apt => apt.status === 'scheduled')
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
                        ? new Date(appointments
                            .filter(apt => apt.status === 'scheduled')
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date)
                            .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                        : 'Nenhuma agendada'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Ações Rápidas */}
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            Ações Rápidas
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Agendar Consulta */}
            <button
              onClick={handleScheduleAppointment}
              className="rounded-xl p-4 text-left transition-transform transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)', boxShadow: '0 10px 24px rgba(26,54,93,0.35)' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white leading-tight">📅 Agendar Consulta</h3>
                  <p className="text-sm text-white/80">Agende sua consulta com profissionais especializados</p>
                </div>
              </div>
            </button>

            {/* Chat com Médico */}
            <button
              onClick={handleOpenChat}
              disabled={chatLoading}
              className={`rounded-xl p-4 text-left transition-transform transform hover:scale-[1.01] ${
                chatLoading ? 'opacity-80 cursor-not-allowed' : ''
              }`}
              style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)', boxShadow: '0 10px 24px rgba(0,193,106,0.35)' }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-white leading-tight">
                    {chatLoading ? '🔄 Abrindo chat...' : '💬 Chat com Médico'}
                  </h3>
                  <p className="text-sm text-white/80">Comunicação direta com seu profissional</p>
                </div>
              </div>
            </button>

            {/* Plano Terapêutico - Card Compacto */}
            <button
              onClick={handleOpenPlan}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/60"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-primary-300" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.35em] text-primary-300">Plano terapêutico</p>
                      <h3 className="text-lg font-semibold text-white">Acompanhamento do plano</h3>
                    </div>
                    {therapeuticPlan && (
                      <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg bg-primary-500/15 border border-primary-500/30 text-xs font-semibold text-primary-200">
                        {therapeuticPlan.progress}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">
                    {patientPrescriptionsLoading
                      ? 'Carregando suas prescrições integrativas...'
                      : totalPrescriptions > 0
                      ? `Você possui ${activePrescriptions.length} prescrição(ões) ativa(s) entre ${totalPrescriptions} registrada(s). Próxima revisão em ${therapeuticPlan?.nextReview ?? 'definição conjunta com a equipe clínica'}.`
                      : 'Nenhuma prescrição ativa no momento. Complete a avaliação clínica para receber um plano terapêutico personalizado.'}
                  </p>
                  {patientPrescriptionsLoading ? (
                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Atualizando prescrições...
                    </div>
                  ) : totalPrescriptions > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {activePrescriptions.slice(0, 2).map(prescription => (
                        <span
                          key={prescription.id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-[11px] text-primary-200"
                        >
                          <Stethoscope className="w-3 h-3" />
                          {prescription.title}
                        </span>
                      ))}
                      {rationalityChips.map(label => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70 text-[11px] text-slate-300"
                        >
                          <Brain className="w-3 h-3 text-slate-500" />
                          {label}
                        </span>
                      ))}
                      {totalPrescriptions > activePrescriptions.length + rationalityChips.length && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-[11px] text-slate-300">
                          +{totalPrescriptions - activePrescriptions.length - rationalityChips.length}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                        <Brain className="w-3 h-3 text-slate-500" />
                        Integrativa
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                        <Zap className="w-3 h-3 text-slate-500" />
                        Individualizado
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                        <Target className="w-3 h-3 text-slate-500" />
                        Multidisciplinar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Conteúdo Educacional */}
            <button
              onClick={handleViewEducational}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-sky-300" />
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">Conteúdo educativo</p>
                    <h3 className="text-lg font-semibold text-white">Biblioteca personalizada</h3>
                  </div>
                  <p className="text-sm text-slate-300">
                    Acesse vídeos, guias e artigos selecionados pela equipe clínica para apoiar seu tratamento integrado.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                      <GraduationCap className="w-3 h-3 text-sky-300" />
                      Trilhas guiadas
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                      <FileText className="w-3 h-3 text-sky-300" />
                      Protocolos clínicos
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Compartilhar Relatório Clínico */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-300" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.35em] text-purple-300">Relatório clínico</p>
                    <h3 className="text-lg font-semibold text-white">
                      {latestClinicalReport ? 'Compartilhe com sua equipe' : 'Gerar relatório inicial'}
                    </h3>
                  </div>
                  {latestClinicalReport && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] font-semibold text-purple-200">
                      {getReportStatusLabel(latestClinicalReport.status)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {latestClinicalReport
                    ? 'A IA residente gera seu relatório clínico com base na avaliação inicial. Compartilhe com o profissional quando estiver pronto.'
                    : 'Comece sua jornada com a avaliação clínica inicial aplicada pela IA residente e gere o relatório base do eixo clínica.'}
                </p>
                {latestClinicalReport && (
                  <p className="text-xs text-slate-500">
                    Gerado em{' '}
                    {latestClinicalReport.generated_at
                      ? new Date(latestClinicalReport.generated_at).toLocaleDateString('pt-BR')
                      : 'data indisponível'}
                    . Você controla o compartilhamento com os profissionais.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              {latestClinicalReport ? (
                <>
                  <button
                    onClick={() => handleShareReport(latestClinicalReport)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    Compartilhar com profissional
                  </button>
                  <button
                    onClick={() =>
                      navigate('/app/clinica/paciente/chat-profissional?origin=patient-dashboard&start=avaliacao-inicial')
                    }
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-purple-400/60 hover:text-purple-200 text-sm font-semibold transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Ver relatório completo
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShouldStartAssessment(true)
                    setActiveTab('chat-noa')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-white text-sm font-semibold transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Iniciar avaliação clínica
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Conteúdo Educacional - Preview */}
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">📚 Conteúdo Educacional</h3>
            <button
              onClick={() => setActiveTab('conteudo')}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
            >
              <span>Ver mais conteúdo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {BASIC_COURSE_HIGHLIGHTS.map(highlight => {
              const Icon = highlight.icon
              return (
                <button
                  key={highlight.id}
                  onClick={() => setActiveTab('conteudo')}
                  className="bg-slate-700 rounded-lg p-4 text-left hover:bg-slate-600 transition-colors border border-slate-700/60"
                >
                  <Icon className={`w-8 h-8 mb-3 ${highlight.accent}`} />
                  <p className="text-[11px] uppercase tracking-[0.28em] text-primary-300 mb-1">{highlight.badge}</p>
                  <h4 className="text-white font-semibold mb-1">{highlight.title}</h4>
                  <p className="text-slate-400 text-xs">{highlight.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Resumo de Funcionalidades */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <Zap className="w-6 h-6 text-amber-400" />
            Funcionalidades Utilizadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border ${totalConsultas > 0 ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-5 h-5 ${totalConsultas > 0 ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className={`font-semibold ${totalConsultas > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                  Agendamento
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {totalConsultas > 0 ? `${totalConsultas} consulta(s) agendada(s)` : 'Ainda não utilizado'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${totalRelatorios > 0 ? 'bg-purple-500/10 border-purple-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className={`w-5 h-5 ${totalRelatorios > 0 ? 'text-purple-400' : 'text-slate-500'}`} />
                <span className={`font-semibold ${totalRelatorios > 0 ? 'text-purple-300' : 'text-slate-400'}`}>
                  Relatórios
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {totalRelatorios > 0 ? `${totalRelatorios} relatório(s) gerado(s)` : 'Ainda não utilizado'}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${totalRecursosEducacionais > 0 ? 'bg-sky-500/10 border-sky-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className={`w-5 h-5 ${totalRecursosEducacionais > 0 ? 'text-sky-400' : 'text-slate-500'}`} />
                <span className={`font-semibold ${totalRecursosEducacionais > 0 ? 'text-sky-300' : 'text-slate-400'}`}>
                  Conteúdo
                </span>
              </div>
              <p className="text-sm text-slate-400">
                {totalRecursosEducacionais > 0 ? `${totalRecursosEducacionais} recurso(s) disponível(is)` : 'Ainda não utilizado'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar Dashboard Principal
  const renderDashboard = () => {
    const rationalityChips = Array.from(
      new Set(
        patientPrescriptions
          .map(prescription =>
            prescription.rationality && RATIONALITY_LABELS[prescription.rationality]
              ? RATIONALITY_LABELS[prescription.rationality]
              : null
          )
          .filter((label): label is string => Boolean(label))
      )
    ).slice(0, 3)

    return (
      <div className="space-y-6">
      {/* Mensagem de Boas-vindas */}
      <div className="rounded-xl p-6 mb-6" style={{ background: 'rgba(7,22,41,0.82)', border: '1px solid rgba(0,193,106,0.12)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Bem-vindo, {user?.name || 'Paciente'}!</h2>
            <p className="text-slate-400">Seu centro de acompanhamento personalizado para cuidado renal e cannabis medicinal</p>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3 bg-slate-700 p-3 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'P'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-white">{user?.name || 'Paciente'}</p>
              <p className="text-sm text-slate-400">Paciente</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Agendar Consulta */}
        <button
          onClick={handleScheduleAppointment}
          className="rounded-xl p-4 text-left transition-transform transform hover:scale-[1.01]"
          style={{ background: 'linear-gradient(135deg, #1a365d 0%, #274a78 100%)', boxShadow: '0 10px 24px rgba(26,54,93,0.35)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white leading-tight">📅 Agendar Consulta</h3>
              <p className="text-sm text-white/80">Agende sua consulta com profissionais especializados</p>
            </div>
          </div>
        </button>

        {/* Chat com Médico */}
        <button
          onClick={handleOpenChat}
          disabled={chatLoading}
          className={`rounded-xl p-4 text-left transition-transform transform hover:scale-[1.01] ${
            chatLoading ? 'opacity-80 cursor-not-allowed' : ''
          }`}
          style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)', boxShadow: '0 10px 24px rgba(0,193,106,0.35)' }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white leading-tight">
                {chatLoading ? '🔄 Abrindo chat...' : '💬 Chat com Médico'}
              </h3>
              <p className="text-sm text-white/80">Comunicação direta com seu profissional</p>
            </div>
          </div>
        </button>

        {/* Plano Terapêutico - Card Compacto */}
        <button
          onClick={handleOpenPlan}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/60"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-300" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-primary-300">Plano terapêutico</p>
                  <h3 className="text-lg font-semibold text-white">Acompanhamento do plano</h3>
                </div>
                {therapeuticPlan && (
                  <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg bg-primary-500/15 border border-primary-500/30 text-xs font-semibold text-primary-200">
                    {therapeuticPlan.progress}%
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-300">
                {patientPrescriptionsLoading
                  ? 'Carregando suas prescrições integrativas...'
                  : totalPrescriptions > 0
                  ? `Você possui ${activePrescriptions.length} prescrição(ões) ativa(s) entre ${totalPrescriptions} registrada(s). Próxima revisão em ${therapeuticPlan?.nextReview ?? 'definição conjunta com a equipe clínica'}.`
                  : 'Nenhuma prescrição ativa no momento. Complete a avaliação clínica para receber um plano terapêutico personalizado.'}
              </p>
              {patientPrescriptionsLoading ? (
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Atualizando prescrições...
                </div>
              ) : totalPrescriptions > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {activePrescriptions.slice(0, 2).map(prescription => (
                    <span
                      key={prescription.id}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-[11px] text-primary-200"
                    >
                      <Stethoscope className="w-3 h-3" />
                      {prescription.title}
                    </span>
                  ))}
                  {rationalityChips.map(label => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70 text-[11px] text-slate-300"
                    >
                      <Brain className="w-3 h-3 text-slate-500" />
                      {label}
                    </span>
                  ))}
                  {totalPrescriptions > activePrescriptions.length + rationalityChips.length && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full border border-slate-700 bg-slate-800/60 text-[11px] text-slate-300">
                      +{totalPrescriptions - activePrescriptions.length - rationalityChips.length}
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                    <Brain className="w-3 h-3 text-slate-500" />
                    Integrativa
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                    <Zap className="w-3 h-3 text-slate-500" />
                    Individualizado
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                    <Target className="w-3 h-3 text-slate-500" />
                    Multidisciplinar
                  </span>
                </div>
              )}
            </div>
          </div>
        </button>

        {/* Conteúdo Educacional */}
        <button
          onClick={handleViewEducational}
          className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 text-left transition-transform hover:-translate-y-0.5 hover:border-sky-500/40 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-sky-300" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-sky-300">Conteúdo educativo</p>
                <h3 className="text-lg font-semibold text-white">Biblioteca personalizada</h3>
              </div>
              <p className="text-sm text-slate-300">
                Acesse vídeos, guias e artigos selecionados pela equipe clínica para apoiar seu tratamento integrado.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                  <GraduationCap className="w-3 h-3 text-sky-300" />
                  Trilhas guiadas
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-900/70">
                  <FileText className="w-3 h-3 text-sky-300" />
                  Protocolos clínicos
                </span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Compartilhar Relatório Clínico */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col justify-between">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-300" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-purple-300">Relatório clínico</p>
                <h3 className="text-lg font-semibold text-white">
                  {latestClinicalReport ? 'Compartilhe com sua equipe' : 'Gerar relatório inicial'}
                </h3>
              </div>
              {latestClinicalReport && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-[11px] font-semibold text-purple-200">
                  {getReportStatusLabel(latestClinicalReport.status)}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {latestClinicalReport
                ? 'A IA residente gera seu relatório clínico com base na avaliação inicial. Compartilhe com o profissional quando estiver pronto.'
                : 'Comece sua jornada com a avaliação clínica inicial aplicada pela IA residente e gere o relatório base do eixo clínica.'}
            </p>
            {latestClinicalReport && (
              <p className="text-xs text-slate-500">
                Gerado em{' '}
                {latestClinicalReport.generated_at
                  ? new Date(latestClinicalReport.generated_at).toLocaleDateString('pt-BR')
                  : 'data indisponível'}
                . Você controla o compartilhamento com os profissionais.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {latestClinicalReport ? (
            <>
              <button
                onClick={() => handleShareReport(latestClinicalReport)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar com profissional
              </button>
              <button
                onClick={() =>
                  navigate('/app/clinica/paciente/chat-profissional?origin=patient-dashboard&start=avaliacao-inicial')
                }
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:border-purple-400/60 hover:text-purple-200 text-sm font-semibold transition-colors"
              >
                <FileText className="w-4 h-4" />
                Ver relatório completo
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setShouldStartAssessment(true)
                setActiveTab('chat-noa')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-white text-sm font-semibold transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              Iniciar avaliação clínica
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Educacional - Preview */}
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">📚 Conteúdo Educacional</h3>
          <button
            onClick={() => setActiveTab('conteudo')}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
          >
            <span>Ver mais conteúdo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BASIC_COURSE_HIGHLIGHTS.map(highlight => {
            const Icon = highlight.icon
            return (
              <button
                key={highlight.id}
                onClick={() => setActiveTab('conteudo')}
                className="bg-slate-700 rounded-lg p-4 text-left hover:bg-slate-600 transition-colors border border-slate-700/60"
              >
                <Icon className={`w-8 h-8 mb-3 ${highlight.accent}`} />
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary-300 mb-1">{highlight.badge}</p>
                <h4 className="text-white font-semibold mb-1">{highlight.title}</h4>
                <p className="text-slate-400 text-xs">{highlight.description}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Card de Orientações para Consulta */}
      {appointments.length > 0 && appointments.some(apt => apt.status === 'scheduled') && (
        <div className="bg-gradient-to-r from-blue-900/80 to-purple-900/80 rounded-xl p-6 border border-blue-500/30">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white mb-3">📋 Orientações para sua Consulta</h3>
              <div className="space-y-2 text-slate-200">
                <p className="text-sm">Para aproveitar ao máximo sua consulta, reúna os seguintes documentos:</p>
                <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                  <li>Exames laboratoriais recentes (sangue, urina, etc.)</li>
                  <li>Laudos de exames de imagem (ultrassom, tomografia, etc.)</li>
                  <li>Prescrições médicas atuais e anteriores</li>
                  <li>Histórico de medicações e tratamentos</li>
                  <li>Relatórios de outras especialidades</li>
                  <li>Documentos de avaliações anteriores (se houver)</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="text-xs text-blue-300">
                    💡 <strong>Dica:</strong> Você pode fazer upload desses documentos na área de "Meus Relatórios" ou compartilhá-los diretamente no chat com o profissional.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}




      {/* Conteúdo Educacional - Preview */}
      <div className="bg-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">📚 Conteúdo Educacional</h3>
          <button
            onClick={() => setActiveTab('conteudo')}
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1"
          >
            <span>Ver mais conteúdo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BASIC_COURSE_HIGHLIGHTS.map(highlight => {
            const Icon = highlight.icon
            return (
              <button
                key={highlight.id}
                onClick={() => setActiveTab('conteudo')}
                className="bg-slate-700 rounded-lg p-4 text-left hover:bg-slate-600 transition-colors border border-slate-700/60"
              >
                <Icon className={`w-8 h-8 mb-3 ${highlight.accent}`} />
                <p className="text-[11px] uppercase tracking-[0.28em] text-primary-300 mb-1">{highlight.badge}</p>
                <h4 className="text-white font-semibold mb-1">{highlight.title}</h4>
                <p className="text-slate-400 text-xs">{highlight.description}</p>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
  }

  // Renderizar Sistema de Agendamento
  const renderAgendamento = () => (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary-300 mb-2">Atendimento Integrado</p>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
            <Calendar className="w-6 h-6 text-primary-300" />
            Sistema de Agendamento
          </h2>
          <p className="text-slate-400 text-sm mt-2 max-w-2xl">
            Agende consultas com os profissionais especializados do MedCannLab e acompanhe seu cronograma clínico em um só lugar.
          </p>
        </div>
        <button
          onClick={() => {
            setActiveTab('meus-agendamentos')
            setActiveCard('meus-agendamentos')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-400 text-white text-sm transition-colors"
        >
          Ver agenda completa
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary-300" />
            Profissionais disponíveis
          </h3>
          <p className="text-xs text-slate-400">
            Escolha um especialista e selecione o melhor horário para o seu acompanhamento.
          </p>
        </div>

        <div className="space-y-4">
          {availableProfessionals.map(professional => (
            <div
              key={professional.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors hover:border-primary-500/40"
            >
              <div className="flex items-start gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center border border-slate-800/60 ${professional.accentClasses}`}>
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-white text-lg font-semibold">{professional.name}</h4>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
                      <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                      {professional.rating}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{professional.role}</p>
                  <p className="text-sm text-slate-300 mt-3 max-w-xl">{professional.excerpt}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(professional.navigateTo)}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${professional.buttonClasses}`}
              >
                Agendar consulta
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-300" />
            Minhas consultas
          </h3>
          {appointments.length > 0 && (
            <button
              onClick={() => navigate('/app/clinica/paciente/agendamentos?view=calendar')}
              className="text-xs text-primary-300 hover:text-primary-200 inline-flex items-center gap-1 transition-colors"
            >
              Ver histórico completo
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {appointments.length > 0 ? (
          <div className="space-y-3">
            {appointments.map(appointment => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary-300" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 uppercase tracking-[0.2em] mb-1">
                      {appointment.type}
                    </p>
                    <h4 className="text-white font-semibold">{appointment.professional}</h4>
                    <p className="text-sm text-slate-300">
                      {new Date(appointment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {appointment.time}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                    appointment.status === 'scheduled'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/40'
                      : appointment.status === 'completed'
                        ? 'bg-blue-500/10 text-blue-300 border-blue-400/40'
                        : 'bg-rose-500/10 text-rose-300 border-rose-400/40'
                  }`}
                >
                  {appointment.status === 'scheduled'
                    ? 'Agendada'
                    : appointment.status === 'completed'
                      ? 'Concluída'
                      : 'Cancelada'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-800 rounded-2xl py-12 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-900 border border-slate-800 mx-auto">
              <Calendar className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Nenhuma consulta agendada até o momento.</p>
              <button
                onClick={handleScheduleAppointment}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-500/40 text-primary-300 hover:bg-primary-500/10 transition-colors text-sm font-semibold"
              >
                Agendar primeira consulta
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  // Renderizar Acompanhamento do Plano Terapêutico
  const renderPlanoTerapeutico = () => {
    const totalPrescriptions = patientPrescriptions.length
    const activePrescriptions = patientPrescriptions.filter(prescription => prescription.status === 'active')
    const latestPrescription = patientPrescriptions[0]
    const hasPrescriptions = totalPrescriptions > 0
    const effectiveProgress = therapeuticPlan
      ? therapeuticPlan.progress
      : hasPrescriptions
      ? Math.round((activePrescriptions.length / totalPrescriptions) * 100)
      : 0
    const planTitle = therapeuticPlan?.title ?? (hasPrescriptions ? 'Plano terapêutico em construção' : 'Plano terapêutico')
    const nextReviewText =
      therapeuticPlan?.nextReview ??
      (latestPrescription?.endsAt
        ? new Date(latestPrescription.endsAt).toLocaleDateString('pt-BR')
        : 'Defina a próxima revisão com a equipe clínica')

    return (
      <div className="space-y-6">
        {(therapeuticPlan || hasPrescriptions) && (
          <div
            className="rounded-xl p-6"
            style={{ background: 'rgba(7,22,41,0.86)', border: '1px solid rgba(0,193,106,0.16)', boxShadow: '0 16px 32px rgba(2,12,27,0.45)' }}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">Progresso do Tratamento</h3>
                <p className="text-slate-300 text-sm">{planTitle}</p>
              </div>
              <div className="px-4 py-2 rounded-lg" style={{ background: 'rgba(0,193,106,0.12)', border: '1px solid rgba(0,193,106,0.28)' }}>
                <span className="text-2xl font-bold text-[#00F5A0]">{effectiveProgress}%</span>
              </div>
            </div>
            <div className="mt-6">
              <div className="w-full h-3 rounded-full" style={{ background: 'rgba(12,34,54,0.75)', border: '1px solid rgba(0,193,106,0.12)' }}>
                <div
                  className="h-3 rounded-full transition-all"
                  style={{ width: `${effectiveProgress}%`, background: 'linear-gradient(135deg, #00C16A 0%, #00F5A0 100%)' }}
                />
              </div>
            </div>
          </div>
        )}

        <div
          className="rounded-xl p-6"
          style={{ background: 'rgba(7,22,41,0.86)', border: '1px solid rgba(0,193,106,0.16)', boxShadow: '0 16px 32px rgba(2,12,27,0.45)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white">Prescrições integrativas</h3>
            {patientPrescriptionsLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                Atualizando...
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                {activePrescriptions.length} ativa(s) • {totalPrescriptions} no histórico
              </span>
            )}
          </div>
          {patientPrescriptionsLoading ? (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-400">
              Carregando prescrições emitidas pela equipe clínica...
            </div>
          ) : hasPrescriptions ? (
            <div className="space-y-3">
              {patientPrescriptions.map(prescription => (
                <div
                  key={prescription.id}
                  className="rounded-lg p-4 space-y-3"
                  style={{ background: 'rgba(12,34,54,0.75)', border: '1px solid rgba(0,193,106,0.14)' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{prescription.title}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Emitida em {new Date(prescription.issuedAt).toLocaleDateString('pt-BR')}
                        {prescription.professionalName ? ` • Profissional: ${prescription.professionalName}` : ''}
                        {prescription.planTitle ? ` • Plano: ${prescription.planTitle}` : ''}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${
                        prescription.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/40'
                          : prescription.status === 'completed'
                          ? 'bg-sky-500/10 text-sky-200 border-sky-400/40'
                          : prescription.status === 'suspended'
                          ? 'bg-amber-500/10 text-amber-200 border-amber-400/40'
                          : 'bg-rose-500/10 text-rose-200 border-rose-400/40'
                      }`}
                    >
                      {prescription.status === 'active'
                        ? 'Ativa'
                        : prescription.status === 'completed'
                        ? 'Concluída'
                        : prescription.status === 'suspended'
                        ? 'Suspensa'
                        : 'Cancelada'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-400 uppercase tracking-[0.2em] block mb-1">Dosagem</span>
                      <p className="text-white font-medium">
                        {prescription.dosage ?? 'Personalizado com a equipe clínica'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-[0.2em] block mb-1">Frequência</span>
                      <p className="text-white font-medium">
                        {prescription.frequency ?? 'Definida no acompanhamento'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-[0.2em] block mb-1">Racionalidade</span>
                      <p className="text-white font-medium">
                        {prescription.rationality && RATIONALITY_LABELS[prescription.rationality]
                          ? RATIONALITY_LABELS[prescription.rationality]
                          : 'Integrativa'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-400">
              Ainda não há prescrições registradas para o seu plano. Elas aparecerão aqui assim que sua equipe clínica emitir um protocolo integrado.
            </div>
          )}
        </div>

        {(therapeuticPlan || hasPrescriptions) && (
          <div
            className="rounded-xl p-6"
            style={{ background: 'rgba(7,22,41,0.86)', border: '1px solid rgba(0,193,106,0.16)', boxShadow: '0 16px 32px rgba(2,12,27,0.45)' }}
          >
            <h3 className="text-xl font-semibold text-white mb-4">Próximas Ações</h3>
            <div className="space-y-3">
              <div className="rounded-lg p-4 flex items-center justify-between" style={{ background: 'rgba(12,34,54,0.75)', border: '1px solid rgba(0,193,106,0.14)' }}>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.18)' }}>
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Revisão do Plano Terapêutico</p>
                    <p className="text-slate-300 text-sm">{nextReviewText}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('agendamento')}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-transform transform hover:scale-[1.02]"
                  style={{ background: 'linear-gradient(135deg, #007BFF 0%, #00C1FF 100%)' }}
                >
                  Agendar revisão
                </button>
              </div>
              {latestPrescription && (
                <div className="rounded-lg p-4 flex items-center justify-between" style={{ background: 'rgba(12,34,54,0.75)', border: '1px solid rgba(0,193,106,0.14)' }}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,193,106,0.15)' }}>
                      <CheckCircle className="w-5 h-5 text-[#00F5A0]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">Última prescrição</p>
                      <p className="text-slate-300 text-sm">
                        {new Date(latestPrescription.issuedAt).toLocaleDateString('pt-BR')}
                        {latestPrescription.professionalName ? ` • ${latestPrescription.professionalName}` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('plano')}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-primary-200 border border-primary-500/40 hover:bg-primary-500/10 transition-colors"
                  >
                    Ver detalhes
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {!therapeuticPlan && !hasPrescriptions && !patientPrescriptionsLoading && (
          <div className="bg-slate-800 rounded-xl p-6 text-center">
            <CheckCircle className="w-16 h-16 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">Nenhum plano terapêutico ativo</p>
            <p className="text-slate-500 text-sm">
              Complete sua avaliação clínica inicial para receber seu plano personalizado ou converse com a equipe clínica para iniciar suas prescrições.
            </p>
          </div>
        )}
      </div>
    )
  }

  // Renderizar Conteúdo Educacional
  const renderConteudoEducacional = () => (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary-300 mb-2">Biblioteca MedCannLab</p>
            <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-primary-300" />
              Conteúdo educacional
            </h2>
            <p className="text-slate-400 text-sm mt-2 max-w-3xl leading-relaxed">
              Acompanhe materiais validados pela equipe clínica sobre cannabis medicinal, nefrologia e autocuidado. Os recursos abaixo
              são disponibilizados conforme seu plano terapêutico e as competências essenciais da pós-graduação.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-xs uppercase tracking-[0.32em] text-primary-200">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary-500/10 border border-primary-500/20 text-primary-100">
              <Zap className="w-3 h-3" />
              Área ativa • Conteúdo clínico
            </span>
            <span className="text-slate-500 normal-case tracking-normal text-[11px]">
              Atualizado conforme plano terapêutico vigente.
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary-300 mb-1">Trilhas guiadas</p>
            <p className="leading-relaxed">
              Conteúdos introdutórios selecionados da pós-graduação em cannabis medicinal para orientar suas prioridades de estudo.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary-300 mb-1">Protocolos clínicos</p>
            <p className="leading-relaxed">
              Sínteses rápidas para consulta durante o acompanhamento: titulação, monitoramento e ajustes personalizados.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-[11px] uppercase tracking-[0.28em] text-primary-300 mb-1">Comunicação terapêutica</p>
            <p className="leading-relaxed">
              Princípios da Arte da Entrevista Clínica para fortalecer sua participação ativa no plano de cuidado.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        {educationalError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 text-rose-200 text-sm px-4 py-3">
            {educationalError}
          </div>
        )}

        {educationalLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Carregando materiais educacionais...
          </div>
        ) : educationalResources.length === 0 ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-5 text-sm text-primary-100">
              Estamos preparando sua biblioteca personalizada. Enquanto isso, selecionamos trechos essenciais do módulo básico do
              curso de cannabis medicinal do Dr. Eduardo Faveret e dos princípios de comunicação do curso Arte da Entrevista Clínica
              para orientar seus próximos passos.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BASIC_MODULE_SNIPPETS.map(snippet => (
                <article
                  key={snippet.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col gap-3 hover:border-primary-500/40 transition-colors"
                >
                  <span className="text-[11px] uppercase tracking-[0.28em] text-primary-300">{snippet.tag}</span>
                  <h3 className="text-lg font-semibold text-white">{snippet.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed">{snippet.summary}</p>
                  {snippet.quiz && (
                    <div className="mt-2 space-y-3">
                      <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">Quiz interativo</p>
                      <p className="text-sm text-slate-200">{snippet.quiz.question}</p>
                      <div className="space-y-2">
                        {snippet.quiz.options.map(option => {
                          const current = quizResponses[snippet.id]
                          const isSelected = current?.selectedOptionId === option.id
                          const status = current?.status
                          const isCorrectOption = status === 'correct' && option.id === snippet.quiz?.correctOptionId
                          const isIncorrectSelected = status === 'incorrect' && isSelected
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleSelectQuizOption(snippet.id, option.id)}
                              className={`w-full text-left text-sm rounded-lg border px-3 py-2 transition-colors ${
                                isCorrectOption
                                  ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-200'
                                  : isIncorrectSelected
                                    ? 'border-amber-400/60 bg-amber-500/10 text-amber-200'
                                    : isSelected
                                      ? 'border-primary-500/60 bg-primary-500/10 text-primary-200'
                                      : 'border-slate-800 bg-slate-900/50 text-slate-200 hover:border-primary-500/40'
                              }`}
                            >
                              <span className="font-semibold mr-2">{option.id}.</span>
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      <button
                        onClick={() => handleSubmitQuiz(snippet.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-primary-500/50 bg-primary-500/10 px-3 py-2 text-xs font-semibold text-primary-100 hover:bg-primary-500/20 transition-colors"
                        disabled={!quizResponses[snippet.id]?.selectedOptionId}
                      >
                        <MessageCircle className="w-3 h-3" />
                        Consultar IA residente
                      </button>
                      {quizResponses[snippet.id]?.status && snippet.quiz.aiFeedback && (
                        <div
                          className={`flex items-start gap-2 rounded-lg border px-3 py-3 text-sm ${
                            quizResponses[snippet.id]?.status === 'correct'
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100'
                              : 'border-amber-500/40 bg-amber-500/10 text-amber-100'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4 mt-0.5" />
                          <div>
                            <p className="font-semibold text-xs uppercase tracking-[0.3em] mb-1">IA residente</p>
                            <p>
                              {quizResponses[snippet.id]?.status === 'correct'
                                ? snippet.quiz.aiFeedback.correct
                                : snippet.quiz.aiFeedback.incorrect}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {educationalResources.map(resource => {
              const visuals = RESOURCE_TYPE_VISUALS[resource.resourceType] ?? RESOURCE_TYPE_VISUALS.other
              const Icon = visuals.icon
              return (
                <article
                  key={resource.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col gap-4 transition-colors hover:border-primary-500/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${visuals.accent}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] uppercase tracking-[0.3em] text-primary-300">
                          {visuals.label}
                        </span>
                        {resource.category && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-900/70 text-[11px] text-slate-300">
                            {resource.category}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-white mt-1">{resource.title}</h3>
                      {resource.description && (
                        <p className="text-sm text-slate-300 mt-2 line-clamp-3">{resource.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                    <span>
                      {resource.publishedAt
                        ? `Disponibilizado em ${new Date(resource.publishedAt).toLocaleDateString('pt-BR')}`
                        : 'Disponibilizado pela equipe clínica'}
                    </span>
                    {resource.url ? (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-300 hover:text-primary-200 transition-colors"
                      >
                        Acessar recurso
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-600 italic">Arquivo disponível durante a consulta</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const activePrescriptions = patientPrescriptions.filter(prescription => prescription.status === 'active')
  const totalPrescriptions = patientPrescriptions.length

  return (
    <div className="flex w-full min-h-screen text-white" style={{ background: backgroundGradient }}>
      {/* PatientSidebar - Integrado ao Layout - Começa do topo */}
      <div 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 overflow-y-auto transition-all duration-300 fixed left-0 top-0 bottom-0 z-40`} 
        style={{ 
          background: backgroundGradient
        }}
      >
        <PatientSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          user={user || undefined}
          activeCard={activeCard}
          onCardClick={handleCardClick}
          chatLoading={chatLoading}
          therapeuticPlan={therapeuticPlan}
          patientPrescriptionsLoading={patientPrescriptionsLoading}
          totalPrescriptions={totalPrescriptions}
          activePrescriptions={activePrescriptions}
          latestClinicalReport={latestClinicalReport}
          onScheduleAppointment={handleScheduleAppointment}
          onOpenChat={handleOpenChat}
          onOpenPlan={handleOpenPlan}
          onViewEducational={handleViewEducational}
          onViewAppointments={handleViewAppointments}
          onViewProfile={handleViewProfile}
          onReportProblem={handleReportProblem}
          onShareReport={() => {
            if (latestClinicalReport) {
              setActiveCard('relatorio-clinico')
              handleShareReport(latestClinicalReport)
            }
          }}
          onStartAssessment={() => {
            setActiveCard('relatorio-clinico')
            setShouldStartAssessment(true)
            setActiveTab('chat-noa')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>

      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all duration-300 flex flex-col ${isSidebarCollapsed ? 'ml-20' : 'ml-64'}`}
        style={{
          overflow: activeTab === 'chat' || activeTab === 'chat-noa' || activeTab === 'meus-agendamentos' ? 'hidden' : 'auto',
          minHeight: '100vh'
        }}
      >
        {activeTab !== 'dashboard' && (
          <div style={{ background: 'rgba(15, 36, 60, 0.75)', borderBottom: '1px solid rgba(28,64,94,0.6)' }}>
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                {activeTab !== 'perfil' && (
                  <button
                    onClick={handleBackToDashboard}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#C8D6E5] hover:text-white transition-colors"
                  >
                    <span className="text-lg">←</span>
                    Voltar ao Dashboard
                  </button>
                )}
                {activeTab === 'perfil' && <div></div>}
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#8FA7BF]">
                  <span>Seção ativa:</span>
                  <span className="text-[#FFD33D]">
                    {activeTab === 'agendamento'
                      ? 'Agendamento'
                      : activeTab === 'meus-agendamentos'
                      ? 'Meus Agendamentos'
                      : activeTab === 'plano'
                      ? 'Plano Terapêutico'
                      : activeTab === 'conteudo'
                      ? 'Conteúdo Educacional'
                      : activeTab === 'chat'
                      ? 'Chat com Médico'
                      : activeTab === 'perfil'
                      ? 'Meu Perfil'
                      : activeTab === 'reportar-problema'
                      ? 'Reportar Problema'
                      : 'Dashboard'}
                  </span>
                </div>
              </div>
              {activeTab === 'perfil' && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Meu Perfil</h1>
                  <p className="text-lg text-slate-300 mb-1">👤 Visualize seus detalhes</p>
                  <p className="text-sm text-slate-400">Visualize seus detalhes, estatísticas e analytics de uso da plataforma</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content - Estilo igual ao do aluno */}
        {activeTab === 'chat' || activeTab === 'chat-noa' || activeTab === 'meus-agendamentos' ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="h-full flex flex-col min-h-0 w-full">
              {activeTab === 'chat' && renderChat()}
              {activeTab === 'chat-noa' && renderChatNoa()}
              {activeTab === 'meus-agendamentos' && renderMeusAgendamentos()}
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 md:px-6 md:py-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="w-full max-w-full mx-auto overflow-x-hidden space-y-8">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'agendamento' && renderAgendamento()}
                {activeTab === 'plano' && renderPlanoTerapeutico()}
                {activeTab === 'conteudo' && renderConteudoEducacional()}
                {activeTab === 'perfil' && renderPerfil()}
                {activeTab === 'reportar-problema' && renderReportProblem()}
              </div>
            </div>
          </div>
        )}
      </div>
      {shareModalOpen && shareModalReportId && user?.id && (
        <ShareReportModal
          reportId={shareModalReportId}
          patientId={user.id}
          reportName={shareModalReportName}
          onClose={() => setShareModalOpen(false)}
          onShareSuccess={() => {
            void loadPatientData()
          }}
        />
      )}

      {/* Interface Conversacional da Nôa Esperança - Fixa no canto */}
      <NoaConversationalInterface 
        userName={user?.name || 'Paciente'}
        userCode={user?.id || 'PATIENT-001'}
        position="bottom-right"
        hideButton={false}
      />
    </div>
  )
}

export default PatientDashboard

