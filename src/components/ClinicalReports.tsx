import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Download,
  Eye,
  Share2,
  QrCode,
  CheckCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Brain,
  Heart,
  Activity,
  Stethoscope,
  Microscope,
  Leaf,
  Zap,
  Target,
  Loader2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Check
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { stripPlatformInjectionNoise } from '../lib/clinicalAssessmentFlow'
import {
  downloadClinicalReportPDF,
  downloadRationalityPDF,
  downloadRationalitiesComparativePDF,
} from '../lib/clinicalReportPDF'

const MEDICAL_RECORD_SESSION_LOOKBACK_MS = 90 * 60 * 1000

function stripClinical(s: unknown): string {
  return stripPlatformInjectionNoise(String(s ?? ''))
}

function stripClinicalList(arr: unknown): string[] {
  if (!Array.isArray(arr)) return []
  return arr.map((x) => stripClinical(x)).filter((t) => t.length > 0)
}

function stripListaIndiciariaItem(item: unknown): string {
  if (item && typeof item === 'object' && 'label' in item && (item as { label?: unknown }).label != null) {
    return stripClinical((item as { label: unknown }).label)
  }
  return stripClinical(typeof item === 'object' ? JSON.stringify(item) : item)
}
import { useAuth } from '../contexts/AuthContext'
import { useUserView } from '../contexts/UserViewContext'
import { rationalityAnalysisService, type Rationality } from '../services/rationalityAnalysisService'
import { clinicalDevolutionService } from '../services/clinicalDevolutionService'
import { useToast } from '../contexts/ToastContext'

interface SharedReport {
  id: string
  patientId: string
  patientName: string
  patientAge: number
  patientCpf: string
  date: string
  assessmentType: string
  status: 'shared' | 'reviewed' | 'validated'
  sharedAt: string
  nftToken?: string
  blockchainHash?: string
  content: {
    chiefComplaint: string
    history: string
    physicalExam: string
    assessment: string
    plan: string
    rationalities: {
      biomedical?: any
      traditionalChinese?: any
      ayurvedic?: any
      homeopathic?: any
      integrative?: any
    }
  }
  rawContent?: Record<string, any>
  doctorNotes?: string
  reviewStatus?: 'pending' | 'reviewed' | 'approved'
  // V1.9.242: signature_hash da Pipeline V1.9.95 (ICP-Brasil automatico).
  // Quando presente, exibe badge "ICP automatico" no card. Ausencia indica
  // report legado pre-26/04 (Pipeline V1.9.95 nao existia ainda).
  hasICPSignature?: boolean
  // V1.9.245: primeiros 16 chars do signature_hash pra exibir no footer do PDF
  // gerado (rastreabilidade ICP-Brasil sem expor hash completo no UI).
  signatureHashShort?: string
}

interface ClinicalReportsProps {
  className?: string
  onShareReport?: (reportId: string) => void
}

const REPORTS_PER_PAGE = 5

const ClinicalReports: React.FC<ClinicalReportsProps> = ({ className = '', onShareReport }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  // V1.9.256 — auto-open modal quando URL traz ?report=XXX (vindo do card de
  // devolucao em Acompanhamento do Plano). Antes, paciente caia na lista e
  // tinha que clicar "Abrir" manual pra ver a faixa V1.9.202 com a nota do
  // medico. Bug Pedro 13/05 18h31: "acessei so vi o meu q fiz antes".
  const [searchParams, setSearchParams] = useSearchParams()
  const autoOpenReportId = searchParams.get('report')
  const { getEffectiveUserType, isAdminViewingAs } = useUserView()
  const [reports, setReports] = useState<SharedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<SharedReport | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'shared' | 'reviewed' | 'validated'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast()

  const effectiveType = getEffectiveUserType(user?.type)
  const isUserAdmin = effectiveType === 'admin'
  const isPatient = effectiveType === 'paciente'

  // V1.9.241 — contador empirico de pendencias (fila de cuidado longitudinal).
  // Vocabulario clinico Ricardo: "aguardando revisao" > "draft/pending".
  // ICP-Brasil e infra invisivel (Pipeline V1.9.95 assina automatico).
  // Revisao = responsabilidade humana, Aprovacao = ato clinico (CFM 2.314).
  const pendingReviewCount = useMemo(
    () => reports.filter(r => r.reviewStatus !== 'reviewed' && r.reviewStatus !== 'approved').length,
    [reports]
  )
  const [selectedRationality, setSelectedRationality] = useState<Rationality | null>(null)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [nftModal, setNftModal] = useState<{ show: boolean; token: string; hash: string }>({ show: false, token: '', hash: '' })
  const [appliedRationalities, setAppliedRationalities] = useState<Set<Rationality>>(new Set())
  const [conversationHistory, setConversationHistory] = useState<Array<{ user_message: string; ai_response: string; created_at: string }>>([])
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [showConversation, setShowConversation] = useState(false)

  // V1.9.248 — Extraido como funcao pura (sem mutar state) pra que
  // handleDownloadReport possa fetch a conversa do paciente CORRETO ao baixar
  // PDF direto do card. Bug critico antes: state conversationHistory global
  // era reusado entre reports → vazava conversa do paciente A no PDF do B.
  const fetchConversationData = useCallback(async (
    patientId: string,
    reportDate?: string
  ): Promise<Array<{ user_message: string; ai_response: string; created_at: string }>> => {
    try {
      let aecMessages: Array<{ user_message: string; ai_response: string; created_at: string; metadata?: unknown }> = []

      // Fetch messages with metadata to identify AEC session
      let query = supabase
        .from('ai_chat_interactions')
        .select('user_message, ai_response, created_at, metadata')
        .eq('user_id', patientId)
        .order('created_at', { ascending: true })
        .limit(500)

      // If we have the report date, only fetch messages up to that point
      let endDateIso: string | undefined
      if (reportDate) {
        // Add 5 min buffer after report creation to capture the final exchange
        endDateIso = new Date(new Date(reportDate).getTime() + 5 * 60 * 1000).toISOString()
        query = query.lte('created_at', endDateIso)
      }

      const { data, error } = await query
      if (!error && data) {
        // Filter out noise
        aecMessages = data.filter((m: any) => {
          const msg = m.user_message || ''
          const resp = m.ai_response || ''
          if (resp.includes('[Modo Acolhimento Offline]')) return false
          if (msg.startsWith('[Contexto da Plataforma:')) return false
          return true
        })

        // Try to isolate AEC session using assessmentPhase metadata or ASSESSMENT_COMPLETED tag
        if (aecMessages.length > 0) {
          // Find the last ASSESSMENT_COMPLETED before/around the report date
          let completedIdx = -1
          for (let j = aecMessages.length - 1; j >= 0; j--) {
            if ((aecMessages[j].ai_response || '').includes('[ASSESSMENT_COMPLETED]')) {
              completedIdx = j
              break
            }
          }

          if (completedIdx >= 0) {
            // Walk backwards to find session start
            let startIdx = 0
            for (let i = completedIdx; i >= 0; i--) {
              const meta = aecMessages[i]?.metadata as Record<string, unknown> | null
              const phase = meta?.assessmentPhase as string | undefined
              // Check for AEC start phases
              if (phase === 'abertura' || phase === 'greeting' || phase === 'initial') {
                startIdx = i
                break
              }
              // Check for AEC greeting text (fallback for older messages without metadata)
              const resp = (aecMessages[i].ai_response || '').toLowerCase()
              if (resp.includes('avaliação clínica inicial') || resp.includes('aec 001') || resp.includes('vou conduzir sua avaliação')) {
                startIdx = i
                break
              }
              // Session boundary: gap > 2 hours
              if (i > 0) {
                const curr = new Date(aecMessages[i].created_at).getTime()
                const prev = new Date(aecMessages[i - 1].created_at).getTime()
                if (curr - prev > 2 * 60 * 60 * 1000) {
                  startIdx = i
                  break
                }
              }
            }
            aecMessages = aecMessages.slice(startIdx, completedIdx + 1)
          }
          // If no ASSESSMENT_COMPLETED found, try filtering only messages with assessmentPhase
          else {
            const phaseMessages = aecMessages.filter((m: any) => {
              const meta = m.metadata as Record<string, unknown> | null
              return meta?.assessmentPhase != null
            })
            if (phaseMessages.length > 0) {
              aecMessages = phaseMessages
            }
            // else: show all filtered messages as fallback (legacy data)
          }
        }
      }

      /** Fluxo Nôa/Core: conversas persistem em patient_medical_records; ai_chat_interactions pode estar vazio. */
      if (aecMessages.length === 0 && reportDate) {
        const tEnd = new Date(reportDate).getTime() + 5 * 60 * 1000
        const tStart = new Date(reportDate).getTime() - MEDICAL_RECORD_SESSION_LOOKBACK_MS
        const { data: rows, error: recErr } = await supabase
          .from('patient_medical_records')
          .select('record_data, created_at')
          .eq('patient_id', patientId)
          .eq('record_type', 'chat_interaction')
          .gte('created_at', new Date(tStart).toISOString())
          .lte('created_at', new Date(tEnd).toISOString())
          .order('created_at', { ascending: true })
          .limit(300)

        if (!recErr && rows && rows.length > 0) {
          aecMessages = rows
            .map((row) => {
              const rd = row.record_data as Record<string, unknown> | null
              const um = String(rd?.user_message ?? '').trim()
              const ar = stripPlatformInjectionNoise(String(rd?.ai_response ?? ''))
              return {
                user_message: stripClinical(um),
                ai_response: ar,
                created_at: row.created_at || '',
              }
            })
            .filter((m) => m.created_at && (m.user_message || m.ai_response))
        }
      }

      return aecMessages.map((m) => ({
        user_message: m.user_message,
        ai_response: m.ai_response,
        created_at: m.created_at,
      }))
    } catch (err) {
      console.error('Erro ao carregar conversa:', err)
      return []
    }
  }, [])

  // V1.9.248 — Wrapper que popula state (usado pelo modal pra renderizar conversa visual).
  const fetchConversation = useCallback(async (patientId: string, reportDate?: string) => {
    setLoadingConversation(true)
    setConversationHistory([])
    try {
      const msgs = await fetchConversationData(patientId, reportDate)
      setConversationHistory(msgs)
    } finally {
      setLoadingConversation(false)
    }
  }, [fetchConversationData])

  useEffect(() => {
    loadSharedReports()
  }, [user?.id])

  // Recarregar quando a aba volta ao foco (se o usuário compartilhou em outra aba)
  useEffect(() => {
    const handleFocus = () => {
      loadSharedReports()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadSharedReports = async () => {
    try {
      setLoading(true)

      if (!user?.id) {
        console.warn('⚠️ Usuário não autenticado')
        setReports([])
        return
      }

      let allReports: any[] = []

      // Admin real (mesmo simulando outro perfil) sempre vê tudo
      const isRealAdmin = isAdminViewingAs || isUserAdmin

      if (isRealAdmin && !isPatient) {
        // Admin ou Admin simulando Profissional → vê TODOS (ou só compartilhados se simulando prof)
        if (effectiveType === 'profissional') {
          // Admin simulando profissional: mostra apenas relatórios compartilhados (todos)
          const { data, error } = await supabase
            .from('clinical_reports')
            .select('*')
            .not('shared_with', 'is', null)
            .order('shared_at', { ascending: false })
          if (error) { console.error('❌ Erro admin-as-prof reports:', error); setReports([]); return }
          allReports = data || []
        } else {
          // Admin puro: vê TUDO
          const { data, error } = await supabase
            .from('clinical_reports')
            .select('*')
            .order('created_at', { ascending: false })
          if (error) { console.error('❌ Erro admin reports:', error); setReports([]); return }
          allReports = data || []
        }
      } else if (isPatient) {
        // Paciente vê SEUS relatórios — todos (dados pertencem ao paciente, LGPD)
        // review_status é para auditoria interna, não bloqueia visibilidade do dono
        const { data, error } = await supabase
          .from('clinical_reports')
          .select('*')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false })
        if (error) { console.error('❌ Erro patient reports:', error); setReports([]); return }
        allReports = data || []
      } else {
        // Profissional: tentar RPC primeiro, fallback manual
        const { data: rpcReports, error: rpcError } = await supabase.rpc('get_shared_reports_for_doctor', {
          p_doctor_id: user.id
        })

        if (!rpcError && rpcReports) {
          allReports = rpcReports
        } else {
          console.warn('⚠️ RPC não disponível, usando busca manual:', rpcError)
          const { data: fetchedReports, error: fetchError } = await supabase
            .from('clinical_reports')
            .select('*')
            .not('shared_with', 'is', null)
            .order('shared_at', { ascending: false })

          if (fetchError) { console.error('❌ Erro fetch:', fetchError); setReports([]); return }

          allReports = (fetchedReports || []).filter(report => {
            const sharedWith = report.shared_with || []
            if (!Array.isArray(sharedWith) || sharedWith.length === 0) return false
            return sharedWith.some((id: any) => id?.toString() === user.id.toString())
          })
        }
      }

      console.log(`📊 Relatórios carregados: ${allReports.length} (role: ${effectiveType})`)

      const formattedReports: SharedReport[] = allReports.map((report: any) => {
        const rawDb = (report.content as Record<string, any>) || {}
        // Pipeline Master encapsula em { raw: { content: {...} }, structured: "...", metadata: {...} }
        // Suporta ambos formatos: legado (campos no topo) e novo (aninhado em raw.content)
        const nested = (rawDb.raw && typeof rawDb.raw === 'object' && rawDb.raw.content && typeof rawDb.raw.content === 'object')
          ? rawDb.raw.content
          : null
        // V1.9.257 — Bug critico (Pedro 13/05 empirico): quando Pipeline Master
        // encapsulou em content.raw.content, mapping perdia doctor_notes +
        // rationalities + review_status + doctor_notes_at/by porque essas chaves
        // ficam no TOP do content jsonb (adicionadas POS-Pipeline pelo medico),
        // nao dentro de raw.content. Paciente abria modal de report devolvido e
        // nao via nota do medico nem racionalidades aplicadas. Audit PAT confirmou
        // top_has_notes=true / raw_has_notes=false. Fix: preserva campos pos-Pipeline
        // do TOP (rawDb) sobre nested, com nested como fallback (compat retroativa).
        const content: Record<string, any> = nested
          ? {
              ...nested,
              structured: rawDb.structured,
              scores: nested.scores || rawDb.raw?.scores,
              risk_level: rawDb.raw?.risk_level,
              doctor_notes: rawDb.doctor_notes ?? nested.doctor_notes,
              rationalities: rawDb.rationalities ?? nested.rationalities,
              doctor_notes_at: rawDb.doctor_notes_at ?? nested.doctor_notes_at,
              doctor_notes_by: rawDb.doctor_notes_by ?? nested.doctor_notes_by,
              review_status: rawDb.review_status ?? nested.review_status,
            }
          : rawDb

        // Map AEC protocol fields to display fields
        const identificacao = content.identificacao || {}
        const apresentacao = typeof identificacao === 'object' ? (identificacao.apresentacao || '') : String(identificacao || '')
        const listaIndiciaria = Array.isArray(content.lista_indiciaria) ? content.lista_indiciaria : []
        const desenvolvimentoQueixa = content.desenvolvimento_queixa || {}
        const habitosVida = Array.isArray(content.habitos_vida) ? content.habitos_vida : []
        const historiaFamiliar = content.historia_familiar || {}
        const hppList = Array.isArray(content.historia_patologica_pregressa) ? content.historia_patologica_pregressa : []
        const queixaPrincipal = stripClinical(String(content.queixa_principal || content.chief_complaint || ''))

        // Build readable content from AEC structure
        const chiefComplaint = stripClinical(
          queixaPrincipal ||
            (listaIndiciaria.length > 0
              ? stripClinicalList(listaIndiciaria).join(', ')
              : apresentacao.substring(0, 200))
        )
        
        const historyParts: string[] = []
        const sint = stripClinicalList(desenvolvimentoQueixa.sintomas_associados)
        const fp = stripClinicalList(desenvolvimentoQueixa.fatores_piora)
        const fm = stripClinicalList(desenvolvimentoQueixa.fatores_melhora)
        const hppStripped = stripClinicalList(hppList)
        if (sint.length) historyParts.push(`Sintomas: ${sint.join(', ')}`)
        if (fp.length) historyParts.push(`Piora: ${fp.join(', ')}`)
        if (fm.length) historyParts.push(`Melhora: ${fm.join(', ')}`)
        if (hppStripped.length) historyParts.push(`HPP: ${hppStripped.join(', ')}`)
        const history = stripClinical(content.history || historyParts.join(' | ') || '')

        const familyParts: string[] = []
        const mat = stripClinicalList(historiaFamiliar.lado_materno)
        const pat = stripClinicalList(historiaFamiliar.lado_paterno)
        if (mat.length) familyParts.push(`Materno: ${mat.join(', ')}`)
        if (pat.length) familyParts.push(`Paterno: ${pat.join(', ')}`)
        const physicalExam = stripClinical(
          content.physical_exam || (familyParts.length ? `História Familiar: ${familyParts.join(' | ')}` : '')
        )

        const assessment =
          stripClinical(content.assessment) ||
          (content.consenso
            ? `Consenso: ${content.consenso.aceito ? 'Aceito' : 'Pendente'} • Revisões: ${content.consenso.revisoes_realizadas || 0}`
            : '')
        const plan = stripClinical(
          content.plan ||
            (habitosVida.length ? `Hábitos: ${stripClinicalList(habitosVida).join(', ')}` : content.evolution || '')
        )

        return {
          id: report.id,
          patientId: report.patient_id,
          patientName: report.patient_name || 'Paciente',
          patientAge: (content.patient_age as number) || 0,
          patientCpf: (content.patient_cpf as string) || '',
          date: report.created_at ?? report.generated_at,
          assessmentType: report.report_type || (content.assessment_type as string) || 'initial_assessment',
          status: (report.status || 'shared') as SharedReport['status'],
          sharedAt: report.shared_at ?? report.generated_at,
          nftToken: content.nft_token as string | undefined,
          blockchainHash: content.blockchain_hash as string | undefined,
          content: {
            chiefComplaint,
            history,
            physicalExam,
            assessment,
            plan,
            // 🔧 FIX: NÃO criar chaves vazias por padrão. Chave vazia faz `hasAnalysis`
            // virar truthy e marca todos os botões como "já aplicados", impedindo a geração.
            // Só preserva chaves que tenham `assessment` real preenchido.
            rationalities: (() => {
              const src = (content.rationalities as Record<string, any>) || {}
              const out: Record<string, any> = {}
              for (const [k, v] of Object.entries(src)) {
                if (v && typeof v === 'object' && typeof (v as any).assessment === 'string' && (v as any).assessment.trim().length > 0) {
                  out[k] = v
                }
              }
              return out as SharedReport['content']['rationalities']
            })()
          },
          doctorNotes: stripClinical(content.doctor_notes) || undefined,
          // V1.9.225 patch — `review_status` é COLUNA TOP-LEVEL em clinical_reports,
          // não dentro de content (jsonb). Empírico 11/05: Ricardo marcou 6 reports
          // como reviewed (banco: review_status='reviewed' TOP-LEVEL); UI lia
          // content.review_status → undefined → fallback 'pending' → aba "Revisados"
          // sempre vazia mesmo após V1.9.200 Sprint 1.
          // Fallback `content.review_status` preservado pra eventual compat retro.
          reviewStatus: (report.review_status as SharedReport['reviewStatus'])
            || (content.review_status as SharedReport['reviewStatus'])
            || 'pending',
          // V1.9.242: flag presenca de assinatura ICP-Brasil automatica (Pipeline V1.9.95)
          hasICPSignature: !!(report.signature_hash),
          // V1.9.245: hash truncado pra footer PDF (rastreabilidade ICP-Brasil)
          signatureHashShort: report.signature_hash
            ? String(report.signature_hash).slice(0, 16)
            : undefined,
          rawContent: content
        }
      })

      setReports(formattedReports)

      // V1.9.256 — Auto-open modal pelo query param ?report=XXX (vindo do card
      // de devolucao). Limpa o param da URL apos abrir pra evitar reabrir em
      // refresh acidental.
      if (autoOpenReportId) {
        const target = formattedReports.find((r) => r.id === autoOpenReportId)
        if (target) {
          setSelectedReport(target)
          setDoctorNotes(target.doctorNotes || '')
          setShowReportModal(true)
          // Buscar conversa do paciente correto (V1.9.248)
          void fetchConversation(target.patientId, target.date)
          // Limpa o param da URL (preserva section)
          const next = new URLSearchParams(searchParams)
          next.delete('report')
          setSearchParams(next, { replace: true })
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sprint 1 Devolution V1 — corrige bug latente (atualizava 'status' do FSM em vez de 'review_status')
  // Reusa schema existente (review_status / reviewed_by / reviewed_at) + clinicalDevolutionService.
  const [isApprovingReport, setIsApprovingReport] = useState(false)

  const handleReviewReport = async (reportId: string, action: 'reviewed' | 'approved') => {
    if (!user?.id) {
      toastError('Sessão inválida', 'Faça login novamente para continuar.')
      return
    }

    setIsApprovingReport(true)
    try {
      if (action === 'reviewed') {
        const res = await clinicalDevolutionService.markAsReviewed(reportId, user.id)
        if (!res.ok) {
          toastError('Não foi possível marcar como revisado', res.error)
          return
        }
        toastSuccess('Relatório marcado como revisado')
      } else {
        // 'approved' = devolução clínica completa (com nota obrigatória pro paciente)
        const report = reports.find(r => r.id === reportId)
        if (!report) {
          toastError('Relatório não encontrado')
          return
        }
        const trimmed = (doctorNotes || '').trim()
        if (trimmed.length < 3) {
          toastWarning(
            'Nota clínica vazia',
            'Para aprovar e devolver, escreva ao menos uma frase para o paciente.'
          )
          return
        }

        const res = await clinicalDevolutionService.approveAndDeliver({
          reportId,
          reviewerId: user.id,
          reviewerName: user.name || undefined,
          patientId: report.patientId,
          patientName: report.patientName,
          doctorNotes: trimmed,
          signWithIcp: false, // V1: opcional, default false (Princípio 42)
          sendEmail: false    // V1: notification in-app primeiro; email vira opt-in V2
        })

        if (!res.ok) {
          toastError('Falha ao devolver', res.error)
          return
        }
        toastSuccess('Devolução enviada', `${report.patientName} foi notificado(a).`)
      }

      loadSharedReports()
      setShowReportModal(false)
      setDoctorNotes('')
    } catch (error: any) {
      console.error('❌ Erro ao revisar/aprovar relatório:', error)
      toastError('Erro inesperado', error?.message || 'Falha ao processar revisão.')
    } finally {
      setIsApprovingReport(false)
    }
  }

  // V1.9.245 — Substituido blob text/plain (Ricardo 13/05: "abre um txt,
  // poderia abrir um pdf pre formatado com estilo e marca d'agua").
  // V1.9.248 — Fix critico de privacidade (Pedro 13/05): antes usava state
  // `conversationHistory` global, que continha conversa do ULTIMO report
  // aberto no modal — vazava conversa do paciente A no PDF do B quando
  // baixava direto do card. Agora fetch a conversa do paciente CORRETO
  // do report-alvo. Sempre. Async.
  const handleDownloadReport = async (report: SharedReport) => {
    try {
      const conversation = await fetchConversationData(report.patientId, report.date)
      downloadClinicalReportPDF({
        report: {
          id: report.id,
          patientName: report.patientName,
          patientAge: report.patientAge,
          patientCpf: report.patientCpf,
          date: report.date,
          status: report.status,
          reviewStatus: report.reviewStatus,
          hasICPSignature: report.hasICPSignature,
          doctorNotes: report.doctorNotes,
          nftToken: report.nftToken,
          blockchainHash: report.blockchainHash,
          content: report.content,
          rawContent: report.rawContent,
        },
        conversationHistory: conversation,
        signatureHashShort: report.signatureHashShort,
      })
    } catch (error) {
      console.error('Erro ao baixar relatorio PDF:', error)
    }
  }

  // V1.9.194 — geração real via Edge Function generate-nft-from-report
  // V1.9.199 — UX: retry silencioso 1x + mensagens amigáveis + loading state robusto
  // Pipeline: report → Pollinations.ai FLUX → SHA-256 → Storage → patient_nfts
  // Idempotente: clicar 2x retorna o mesmo NFT existente.
  const [nftLoading, setNftLoading] = useState(false)

  const friendlyNftError = (raw: string): string => {
    const msg = (raw || '').toLowerCase()
    if (msg.includes('non-2xx') || msg.includes('functionshttperror') || msg.includes('502') || msg.includes('503') || msg.includes('504')) {
      return 'Servidor de geração ocupado no momento. Muitas assinaturas sendo criadas — tente novamente em alguns segundos.'
    }
    if (msg.includes('timeout') || msg.includes('timed out')) {
      return 'A geração demorou mais que o esperado. Tente novamente — costuma funcionar na 2ª tentativa.'
    }
    if (msg.includes('network') || msg.includes('fetch failed') || msg.includes('failed to fetch')) {
      return 'Sem conexão estável com o servidor. Verifique sua internet e tente novamente.'
    }
    if (msg.includes('rate') || msg.includes('limit')) {
      return 'Muitas tentativas em sequência. Aguarde um momento e tente novamente.'
    }
    return 'Não foi possível gerar a assinatura visual agora. Tente novamente em instantes.'
  }

  const invokeNftEdge = async (reportId: string) => {
    return await supabase.functions.invoke('generate-nft-from-report', {
      body: { report_id: reportId },
    })
  }

  const handleGenerateNFT = async (report: SharedReport) => {
    if (nftLoading) return
    setNftLoading(true)
    try {
      let { data, error } = await invokeNftEdge(report.id)

      // Retry silencioso 1x após 2s se falhou (Pollinations às vezes está congestionado)
      if (error || !data?.success) {
        console.warn('NFT 1ª tentativa falhou, retry silencioso em 2s...', error || data?.error)
        await new Promise(r => setTimeout(r, 2000))
        const retry = await invokeNftEdge(report.id)
        data = retry.data
        error = retry.error
      }

      if (error) {
        console.error('Erro Edge Function generate-nft-from-report (após retry):', error)
        toastError('Não foi possível gerar', friendlyNftError(error.message || ''))
        return
      }

      if (!data?.success) {
        console.error('Resposta sem success (após retry):', data)
        toastError('Falha na geração', friendlyNftError(data?.error || ''))
        return
      }

      const nft = data.nft || {}
      const token = `NFT-${(nft.id || '').slice(0, 8)}`
      const hash = nft.image_hash ? `0x${nft.image_hash.slice(0, 12)}` : '—'
      setNftModal({ show: true, token, hash })

      if (data.already_exists) {
        console.log('NFT já existia para este relatório — retornando existente')
      } else {
        console.log('Nova assinatura visual gerada:', nft.id)
      }
    } catch (error) {
      console.error('Erro ao gerar NFT:', error)
      toastError('Erro ao gerar', friendlyNftError(error instanceof Error ? error.message : String(error)))
    } finally {
      setNftLoading(false)
    }
  }

  const handleApplyRationality = async (rationality: Rationality) => {
    if (!selectedReport || !user) {
      toastError('Sessão inválida', 'Relatório ou usuário não encontrado.')
      return
    }

    try {
      setIsGeneratingAnalysis(true)
      setSelectedRationality(rationality)

      // Gerar análise (com RAG do paciente + base de conhecimento)
      // [V1.9.42] Passa o report inteiro (não apenas .content) — V1.9.40 já
      // prioriza rawContent (schema PT) sobre content (schema EN mapeado).
      // Antes passávamos só `selectedReport.content` (EN) → gate de densidade
      // disparava falso positivo porque lista_indiciaria não existe no schema EN.
      // Inclui patient_name pra o prompt identificar o paciente por nome.
      const analysis = await rationalityAnalysisService.generateAnalysis(
        {
          rawContent: selectedReport.rawContent,
          content: selectedReport.content,
          patient_name: selectedReport.patientName,
        },
        rationality,
        user.id,
        user.email,
        selectedReport.patientId
      )

      // Salvar no relatório (saveAnalysisToReport faz UPDATE em clinical_reports
      // E upsert em clinical_rationalities — falhas de RLS no UPDATE não devem
      // mascarar a persistência estruturada)
      try {
        await rationalityAnalysisService.saveAnalysisToReport(
          selectedReport.id,
          rationality,
          analysis,
          selectedReport.patientId
        )
      } catch (saveErr) {
        console.error('⚠️ Persistência parcial — análise gerada mas falhou ao salvar:', saveErr)
        toastWarning(
          'Análise gerada, persistência parcial',
          `Análise ${rationality} gerada, mas falhou ao salvar permanentemente. Disponível nesta sessão.`
        )
      }

      // Recarregar relatórios para atualizar a UI
      await loadSharedReports()

      // Atualizar selectedReport com a nova análise (mesmo se save falhou parcialmente)
      const updatedRationalities = {
        ...(selectedReport.content?.rationalities || {}),
        [rationality === 'traditional_chinese' ? 'traditionalChinese' : rationality]: analysis
      }
      setSelectedReport({
        ...selectedReport,
        content: {
          ...selectedReport.content,
          rationalities: updatedRationalities
        }
      })

      // Scroll até o card de resultados para o usuário ver a análise gerada
      setTimeout(() => {
        document.getElementById('rationalities-results-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 250)
    } catch (error) {
      console.error('Erro ao aplicar racionalidade:', error)
      toastError(
        `Não foi possível gerar análise ${rationality}`,
        error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.'
      )
    } finally {
      setIsGeneratingAnalysis(false)
      setSelectedRationality(null)
    }
  }

  // 🔬 Aplica TODAS as racionalidades em sequência (modo comparativo)
  const handleApplyAllRationalities = async () => {
    if (!selectedReport || !user) return
    const all: Rationality[] = ['biomedical', 'traditional_chinese', 'ayurvedic', 'homeopathic', 'integrative']
    const pending = all.filter((r) => {
      const key = r === 'traditional_chinese' ? 'traditionalChinese' : r
      return !(selectedReport.content.rationalities as any)?.[key]
    })
    if (pending.length === 0) {
      // Todas já existem → fazer scroll até o card de análises para visualizar
      const el = document.getElementById('rationalities-results-card')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.add('ring-2', 'ring-emerald-400/60')
        setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-400/60'), 1800)
      }
      return
    }
    for (const rat of pending) {
      // eslint-disable-next-line no-await-in-loop
      await handleApplyRationality(rat)
    }
    // Após gerar tudo, scroll até o resultado
    setTimeout(() => {
      document.getElementById('rationalities-results-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 300)
  }

  // V1.9.247 — Refatorado de TXT pra PDF MedCannLab (coerencia com V1.9.245).
  // Baixar TODAS racionalidades aplicadas em PDF comparativo com brand.
  const handleDownloadAllRationalities = () => {
    if (!selectedReport) return
    try {
      downloadRationalitiesComparativePDF({
        patientName: selectedReport.patientName,
        reportId: selectedReport.id,
        rationalities: selectedReport.content.rationalities || {},
        signatureHashShort: selectedReport.signatureHashShort,
      })
    } catch (error) {
      console.error('Erro ao baixar comparativo PDF:', error)
    }
  }

  // V1.9.247 — Baixar analise individual de UMA racionalidade em PDF MedCannLab.
  const handleDownloadRationality = (rationalityKey: string, value: any) => {
    if (!selectedReport || !value) return
    try {
      downloadRationalityPDF({
        patientName: selectedReport.patientName,
        reportDate: selectedReport.date,
        reportId: selectedReport.id,
        rationalityKey,
        value,
        signatureHashShort: selectedReport.signatureHashShort,
      })
    } catch (error) {
      console.error('Erro ao baixar racionalidade PDF:', error)
    }
  }

  // 📤 Compartilhar análise individual
  const handleShareRationality = async (rationalityKey: string, value: any) => {
    if (!selectedReport || !value) return
    const labelMap: Record<string, string> = {
      biomedical: 'Biomédica',
      traditionalChinese: 'Medicina Tradicional Chinesa',
      ayurvedic: 'Ayurvédica',
      homeopathic: 'Homeopática',
      integrative: 'Integrativa'
    }
    const label = labelMap[rationalityKey] || rationalityKey
    const text = `Análise ${label} — ${selectedReport.patientName}\n\n${stripClinical(value.assessment || '')}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `Análise ${label}`, text })
      } else {
        await navigator.clipboard.writeText(text)
        toastSuccess('Análise copiada', 'Texto disponível na área de transferência.')
      }
    } catch (err) {
      console.warn('Share cancelado/erro:', err)
    }
  }

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true
    // V1.9.225 — 'reviewed' é REVISÃO MÉDICA (review_status), NÃO status FSM AEC.
    // Bug empírico 11/05: Ricardo marcou 6 reports como reviewed (clinicalDevolutionService
    // .markAsReviewed → review_status='reviewed'), mas filterStatus comparava com
    // report.status (FSM 'completed' | 'shared' | etc) → aba "Revisados" ficava vazia
    // pro paciente. Schema correto já existe: review_status mapeado pra reviewStatus
    // em ~linha 420 (V1.9.200 Sprint 1 Devolution). Só faltava o filtro usar.
    // 'shared' e 'validated' continuam lendo status FSM (sem mudança de design).
    if (filterStatus === 'reviewed') return report.reviewStatus === 'reviewed'
    // V1.9.226 — Mesmo padrão V1.9.225 pra aba "Validados". Empírico 11/05:
    // 'validated' não existe em FSM status nem review_status (schema:
    // 'draft' | 'reviewed' | 'approved' | 'rejected'). Convenção UI:
    // "Validados" = approved (após "Aprovar e devolver").
    if (filterStatus === 'validated') return report.reviewStatus === 'approved'
    return report.status === filterStatus
  })

  // Reset page when filter changes
  useEffect(() => { setCurrentPage(1) }, [filterStatus])

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / REPORTS_PER_PAGE))
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * REPORTS_PER_PAGE,
    currentPage * REPORTS_PER_PAGE
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shared': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'reviewed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'validated': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'shared': return <Share2 className="w-4 h-4" />
      case 'reviewed': return <Eye className="w-4 h-4" />
      case 'validated': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getRationalityIcon = (rationality: string) => {
    switch (rationality) {
      case 'biomedical': return <Microscope className="w-4 h-4" />
      case 'traditionalChinese': return <Leaf className="w-4 h-4" />
      case 'ayurvedic': return <Zap className="w-4 h-4" />
      case 'homeopathic': return <Target className="w-4 h-4" />
      case 'integrative': return <Brain className="w-4 h-4" />
      default: return <Stethoscope className="w-4 h-4" />
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div
        className="rounded-xl p-6 shadow-lg border"
        style={{
          background: 'rgba(7, 22, 41, 0.88)',
          borderColor: 'rgba(0, 193, 106, 0.12)',
          boxShadow: '0 18px 42px rgba(2, 12, 27, 0.55)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2 flex-wrap">
              <FileText className="w-6 h-6 text-[#00C16A]" />
              <span>{isPatient ? 'Meus Relatórios Clínicos' : isUserAdmin ? 'Todos os Relatórios Clínicos' : 'Relatórios da Avaliação Clínica Inicial'}</span>
              {/* V1.9.241 (C) — contador de fila clinica longitudinal pra medico/admin */}
              {!isPatient && pendingReviewCount > 0 && (
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
                  title="Reports aguardando sua revisão clínica"
                >
                  <Clock className="w-3 h-3" />
                  {pendingReviewCount} aguardando revisão
                </span>
              )}
              {/* V1.9.241 (B) — tooltip educativo: ICP automatico via Pipeline */}
              {!isPatient && (
                <span
                  className="cursor-help text-slate-400 hover:text-slate-200 transition-colors"
                  title="Reports clínicos vêm assinados automaticamente com ICP-Brasil pelo Pipeline V1.9.95. Sua tarefa é a validação clínica humana: clique no card para revisar, escrever nota e devolver ao paciente (CFM 2.314/2022)."
                  aria-label="Informação sobre fluxo de assinatura"
                >
                  <Info className="w-4 h-4" />
                </span>
              )}
            </h2>
            <p className="text-[#C8D6E5]">
              {isPatient ? 'Seus relatórios de avaliação clínica' : isUserAdmin ? 'Visão administrativa de todos os relatórios' : 'Sua fila de revisão clínica longitudinal — clique em um relatório para revisar e devolver ao paciente'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => loadSharedReports()}
              className="px-3 py-1 text-sm rounded-md transition-colors"
              style={{
                background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(0, 193, 106, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00D97A 0%, #158A5F 100%)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)'
              }}
              title="Recarregar relatórios"
            >
              🔄 Atualizar
            </button>
            <span className="text-sm text-[#94A3B8]">
              {filteredReports.length} relatórios
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'Todos', icon: <FileText className="w-4 h-4" /> },
            { key: 'shared', label: 'Compartilhados', icon: <Share2 className="w-4 h-4" /> },
            { key: 'reviewed', label: 'Revisados', icon: <Eye className="w-4 h-4" /> },
            { key: 'validated', label: 'Validados', icon: <CheckCircle className="w-4 h-4" /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key as any)}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm transition-colors"
              style={
                filterStatus === key
                  ? {
                    background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(0, 193, 106, 0.3)'
                  }
                  : {
                    background: 'rgba(15, 36, 60, 0.7)',
                    color: '#C8D6E5',
                    border: '1px solid rgba(0, 193, 106, 0.12)'
                  }
              }
              onMouseEnter={(e) => {
                if (filterStatus !== key) {
                  e.currentTarget.style.background = 'rgba(0, 193, 106, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.2)'
                }
              }}
              onMouseLeave={(e) => {
                if (filterStatus !== key) {
                  e.currentTarget.style.background = 'rgba(15, 36, 60, 0.7)'
                  e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.12)'
                }
              }}
            >
              {icon}
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Relatórios */}
      {loading ? (
        <div className="text-center text-slate-500 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
          Carregando relatórios...
        </div>
      ) : filteredReports.length > 0 ? (
        <>
        <div className="space-y-4">
          {paginatedReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl p-6 shadow-lg border hover:shadow-xl transition-all"
              style={{
                background: 'rgba(15, 36, 60, 0.7)',
                borderColor: 'rgba(0, 193, 106, 0.12)',
                boxShadow: '0 8px 24px rgba(2, 12, 27, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.25)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(2, 12, 27, 0.55)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 193, 106, 0.12)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(2, 12, 27, 0.4)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <User className="w-5 h-5 text-slate-400" />
                    <h3 className="text-lg font-semibold text-white">{report.patientName}</h3>
                    {report.patientCpf && <span className="text-sm text-slate-400">CPF: {report.patientCpf}</span>}
                    {report.patientAge > 0 && <span className="text-sm text-slate-400">Idade: {report.patientAge} anos</span>}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Compartilhado em: {new Date(report.sharedAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(report.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* V1.9.241 (A) — Badge contextual com vocabulario clinico Ricardo 13/05.
                      Princípio: "validar clinicamente" > "assinar tecnicamente".
                      ICP-Brasil é infra invisível (Pipeline V1.9.95 assina automatico).
                      Revisao = responsabilidade humana. Aprovacao = ato clinico CFM 2.314.
                      Vocabulario centrado em humano: "Aguardando sua revisão" > "draft/pending". */}
                  {report.reviewStatus === 'approved' ? (
                    <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>{isPatient ? 'Devolvido com nota clínica' : 'Aprovado e devolvido'}</span>
                    </span>
                  ) : report.reviewStatus === 'reviewed' ? (
                    <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm border bg-blue-500/10 text-blue-400 border-blue-500/20">
                      <Check className="w-3.5 h-3.5" />
                      <span>{isPatient ? 'Revisado pelo médico' : 'Revisado'}</span>
                    </span>
                  ) : !isPatient ? (
                    <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm border bg-amber-500/10 text-amber-300 border-amber-500/30">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Aguardando sua revisão</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2 py-1 rounded-full text-sm border bg-slate-500/10 text-slate-400 border-slate-500/20">
                      {getStatusIcon(report.status)}
                      <span>Aguardando revisão médica</span>
                    </span>
                  )}
                  {/* V1.9.242 — Badge "ICP automático" pra report assinado via Pipeline V1.9.95.
                      Educa medico: ICP-Brasil e infra invisivel, automatica. Validacao clinica
                      e responsabilidade humana separada (review_status). */}
                  {report.hasICPSignature && (
                    <span
                      className="px-2 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1"
                      title="Assinado automaticamente com ICP-Brasil pelo Pipeline V1.9.95 (CFM 2.314/2022). Validacao clinica e separada — clique pra revisar."
                    >
                      <Sparkles className="w-3 h-3" />
                      ICP automático
                    </span>
                  )}
                  {report.nftToken && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      NFT: {report.nftToken}
                    </span>
                  )}
                </div>
              </div>

              {/* V1.9.202 — Selo visual quando relatório teve devolução clínica completa */}
              {report.reviewStatus === 'approved' && report.doctorNotes && (
                <div
                  className="mb-4 rounded-lg p-3 border flex items-start gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
                    borderColor: 'rgba(16, 185, 129, 0.25)'
                  }}
                  aria-label="Relatório revisado pelo médico com devolução clínica"
                >
                  <Stethoscope className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wide mb-1 flex items-center gap-2">
                      Devolução do médico
                      <span className="text-emerald-400/70 normal-case tracking-normal text-[10px] font-normal">
                        ·  recebida
                      </span>
                    </div>
                    <p className="text-sm text-slate-200/90 line-clamp-2 leading-relaxed">
                      {report.doctorNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Resumo do Relatório */}
              <div className="mb-4">
                <h4 className="font-semibold text-slate-300 mb-2">Resumo da Avaliação:</h4>
                {report.content.chiefComplaint && (
                  <p className="text-slate-400 text-sm mb-2">
                    <strong className="text-slate-300">Queixa Principal:</strong> {report.content.chiefComplaint}
                  </p>
                )}
                {report.content.assessment && (
                  <p className="text-slate-400 text-sm">
                    <strong className="text-slate-300">Avaliação:</strong> {report.content.assessment}
                  </p>
                )}
              </div>

              {/* Racionalidades Médicas */}
              <div className="mb-4">
                <h4 className="font-semibold text-slate-300 mb-2">Racionalidades Médicas:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(report.content?.rationalities || {}).map(([key, value]: [string, any]) => {
                    const hasAnalysis = value && (value.assessment || value.recommendations)
                    return (
                      <div
                        key={key}
                        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                          hasAnalysis ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}
                      >
                        {getRationalityIcon(key)}
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        {hasAnalysis && <CheckCircle className="w-3 h-3" />}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Ações */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={async () => {
                    let reportToOpen = report
                    // 🔧 FALLBACK: se rawContent não tem dados AEC ricos, tentar hidratar
                    // a partir do snapshot mais recente em aec_assessment_state do paciente.
                    const hasAecData = report.rawContent && (
                      report.rawContent.queixa_principal ||
                      (Array.isArray(report.rawContent.lista_indiciaria) && report.rawContent.lista_indiciaria.length > 0) ||
                      report.rawContent.desenvolvimento_queixa
                    )
                    if (!hasAecData && report.patientId) {
                      try {
                        const { data: aecState } = await (supabase as any)
                          .from('aec_assessment_state')
                          .select('data, last_update')
                          .eq('user_id', report.patientId)
                          .order('last_update', { ascending: false })
                          .limit(1)
                          .maybeSingle()
                        if (aecState?.data) {
                          const d = aecState.data as Record<string, any>
                          // Mapear campos do estado AEC (camelCase) para o shape esperado pelo renderer (snake_case)
                          const hydrated: Record<string, any> = {
                            ...(report.rawContent || {}),
                            queixa_principal: d.complaintList && Array.isArray(d.complaintList) && d.complaintList.length > 0
                              ? String(d.complaintList[0])
                              : (report.rawContent?.queixa_principal || ''),
                            lista_indiciaria: Array.isArray(d.complaintList) ? d.complaintList : [],
                            desenvolvimento_queixa: {
                              descricao: d.complaintWorsening || '',
                              localizacao: d.complaintImprovements || '',
                              inicio: d.complaintAssociatedSymptoms || '',
                              sintomas_associados: Array.isArray(d.complaintAssociatedSymptoms) ? d.complaintAssociatedSymptoms : [],
                              fatores_melhora: Array.isArray(d.complaintImprovements) ? d.complaintImprovements : [],
                              fatores_piora: Array.isArray(d.complaintWorsening) ? d.complaintWorsening : []
                            },
                            historia_familiar: {
                              lado_materno: d.familyHistoryMother ? [d.familyHistoryMother] : [],
                              lado_paterno: d.familyHistoryFather ? [d.familyHistoryFather] : []
                            },
                            habitos_vida: Array.isArray(d.lifestyleHabits) ? d.lifestyleHabits : [],
                            historia_patologica_pregressa: Array.isArray(d.medicalHistory) ? d.medicalHistory : [],
                            consenso: {
                              aceito: !!d.consensusAgreed,
                              revisoes_realizadas: d.consensusRevisions || 0
                            },
                            _hydrated_from_aec_state: true
                          }
                          reportToOpen = { ...report, rawContent: hydrated }
                        }
                      } catch (hydrateErr) {
                        console.warn('Hidratação AEC falhou (seguindo com dados originais):', hydrateErr)
                      }
                    }
                    setSelectedReport(reportToOpen)
                    setDoctorNotes(reportToOpen.doctorNotes || '')
                    setShowReportModal(true)
                    setShowConversation(false)
                    fetchConversation(reportToOpen.patientId, reportToOpen.date)
                    const applied = new Set<Rationality>()
                    Object.entries(reportToOpen.content.rationalities || {}).forEach(([key, value]: [string, any]) => {
                      if (value && value.assessment) {
                        const rationalityKey = key === 'traditionalChinese' ? 'traditional_chinese' : key
                        applied.add(rationalityKey as Rationality)
                      }
                    })
                    setAppliedRationalities(applied)
                  }}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white"
                  style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)' }}
                  title="Abrir para revisar, escrever nota clínica e devolver ao paciente"
                >
                  <Eye className="w-4 h-4" />
                  <span>{isPatient ? 'Abrir' : 'Abrir para revisar'}</span>
                </button>
                {/* V1.9.242 — Compartilhar so pra paciente (acao do dono do relatorio). */}
                {isPatient && onShareReport && (
                  <button
                    onClick={() => onShareReport(report.id)}
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white bg-slate-600/50 border border-slate-500/30 hover:bg-slate-600/80"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar</span>
                  </button>
                )}
                {/* V1.9.246 — Download no card pra TODOS (paciente + medico + admin).
                    Pedro 13/05: medico precisa baixar PDF formatado pra arquivo/leitura
                    pos-consulta. Reusa V1.9.245 (PDF MedCannLab com marca d'agua, ICP).
                    Modal do medico tambem tem icone Baixar no header (atalho rapido). */}
                <button
                  onClick={() => handleDownloadReport(report)}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white bg-slate-600/50 border border-slate-500/30 hover:bg-slate-600/80"
                  title="Baixar PDF formatado do relatorio (marca d'agua MedCannLab, ICP-Brasil)"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                {/* V1.9.243 — Gerar NFT no card SO pra paciente (Pedro 13/05):
                    Paciente ve NFT no card (apresentacao de estado do proprio relatorio).
                    Medico/admin nao tem NFT no card — botao fica no modal pos-revisao
                    (acao consciente clinica), evita anti-padrao "proibido" com nftLoading. */}
                {isPatient && (
                  <button
                    onClick={() => handleGenerateNFT(report)}
                    disabled={nftLoading}
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white bg-slate-600/50 border border-slate-500/30 hover:bg-slate-600/80 disabled:opacity-60 disabled:cursor-not-allowed"
                    title={nftLoading ? 'Gerando assinatura visual...' : 'Gerar certificado NFT do relatório'}
                  >
                    {nftLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    <span>{nftLoading ? 'Gerando...' : 'Gerar NFT'}</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between rounded-xl p-4 border"
              style={{
                background: 'rgba(7, 22, 41, 0.7)',
                borderColor: 'rgba(0, 193, 106, 0.12)'
              }}
            >
              <span className="text-sm text-slate-400">
                Página {currentPage} de {totalPages} • {filteredReports.length} relatórios
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-30"
                  style={{
                    background: 'rgba(15, 36, 60, 0.7)',
                    color: '#C8D6E5',
                    border: '1px solid rgba(0, 193, 106, 0.12)'
                  }}
                >
                  ← Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 rounded-md text-sm font-medium transition-colors"
                    style={
                      page === currentPage
                        ? { background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)', color: '#fff' }
                        : { background: 'rgba(15, 36, 60, 0.7)', color: '#C8D6E5', border: '1px solid rgba(0, 193, 106, 0.12)' }
                    }
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm rounded-md transition-colors disabled:opacity-30"
                  style={{
                    background: 'rgba(15, 36, 60, 0.7)',
                    color: '#C8D6E5',
                    border: '1px solid rgba(0, 193, 106, 0.12)'
                  }}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div
          className="text-center py-12 rounded-xl border"
          style={{
            background: 'rgba(15, 36, 60, 0.5)',
            borderColor: 'rgba(0, 193, 106, 0.08)'
          }}
        >
          <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          {/* V1.9.250 — Mensagem vazio CONTEXTUAL ao filtro selecionado.
              Bug reportado por Ricardo 13/05 ~14h46: clicou "Revisados" e
              viu "Nenhum relatório compartilhado / pacientes ainda não
              compartilharam" — misleading, contradiz badge "32 aguardando
              revisão" no header. Mensagem agora reflete o filtro ativo. */}
          {(() => {
            const baseTitle = isPatient ? 'Nenhum relatório' : 'Lista vazia neste filtro'
            const titleByFilter: Record<typeof filterStatus, string> = {
              all: isPatient ? 'Nenhum relatório encontrado' : (isUserAdmin ? 'Nenhum relatório na plataforma' : 'Nenhum relatório compartilhado'),
              shared: isPatient ? `${baseTitle} compartilhado` : 'Nenhum relatório compartilhado pendente',
              reviewed: isPatient ? `${baseTitle} revisado ainda` : 'Nenhum relatório marcado como revisado',
              validated: isPatient ? `${baseTitle} validado ainda` : 'Nenhum relatório aprovado e devolvido',
            }
            const bodyByFilter: Record<typeof filterStatus, string> = {
              all: isPatient
                ? 'Você ainda não possui relatórios de avaliação clínica. Converse com a Nôa para iniciar sua avaliação.'
                : isUserAdmin
                  ? 'Ainda não existem relatórios clínicos na plataforma.'
                  : 'Os pacientes ainda não compartilharam relatórios de avaliação clínica com você.',
              shared: isPatient
                ? 'Nenhum dos seus relatórios está em estado "compartilhado" no momento.'
                : 'Nenhum paciente tem relatório em estado "compartilhado" no momento. Veja a aba "Todos" para o histórico completo.',
              reviewed: isPatient
                ? 'Seu médico ainda não marcou nenhum relatório como revisado. Aguarde a análise clínica.'
                : 'Você ainda não marcou nenhum relatório como revisado. Abra um relatório na aba "Todos" e use "Aprovar e devolver" para iniciar a fila clínica longitudinal.',
              validated: isPatient
                ? 'Nenhum relatório foi aprovado e devolvido ainda pelo seu médico. Cada devolução clínica vem com nota personalizada.'
                : 'Nenhum relatório foi aprovado e devolvido ao paciente ainda. Aprovar fecha o ciclo clínico longitudinal (Sprint 1 Devolution).',
            }
            return (
              <>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">{titleByFilter[filterStatus]}</h3>
                <p className="text-slate-500">{bodyByFilter[filterStatus]}</p>
              </>
            )
          })()}
        </div>
      )}

      {/* Modal de Revisão */}
      {showReportModal && selectedReport && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clinical-report-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setShowReportModal(false) }}
        >
          <div
            className="rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto border"
            style={{
              background: 'rgba(7, 22, 41, 0.95)',
              borderColor: 'rgba(0, 193, 106, 0.15)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 id="clinical-report-modal-title" className="text-xl font-bold text-white">
                {isPatient ? 'Detalhes do Relatório' : `Revisar Relatório - ${selectedReport.patientName}`}
              </h3>
              <div className="flex items-center gap-2">
                {/* V1.9.244 — Baixar como icone utilitario no header (medico/admin so).
                    Filosofia: footer = fluxo clinico (Aprovar e devolver dominante).
                    Header = utilitarios (download). Reduz competicao visual com CTA. */}
                {!isPatient && (
                  <button
                    onClick={() => handleDownloadReport(selectedReport)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                    aria-label="Baixar relatório em PDF"
                    title="Baixar PDF do relatório"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setShowReportModal(false)}
                  className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-xl"
                  aria-label="Fechar relatório"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* V1.9.202 — Faixa de devolução clínica visível ao abrir relatório aprovado */}
            {selectedReport.reviewStatus === 'approved' && selectedReport.doctorNotes && (
              <div
                className="mb-4 rounded-lg p-4 border"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(6, 182, 212, 0.06) 100%)',
                  borderColor: 'rgba(16, 185, 129, 0.30)'
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Stethoscope className="w-4 h-4 text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-emerald-300 uppercase tracking-wide mb-1">
                      Devolução clínica do médico
                    </div>
                    <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
                      {selectedReport.doctorNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Conteúdo Completo do Relatório AEC */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="font-semibold text-slate-200 mb-3">Conteúdo do Relatório:</h4>

                {/* Markdown estruturado vindo do Pipeline Master (quando disponível) */}
                {selectedReport.rawContent?.structured && typeof selectedReport.rawContent.structured === 'string' && (
                  <div className="mb-4 bg-slate-900/40 rounded-lg p-4 border border-emerald-500/20">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-200 leading-relaxed">
                      {stripClinical(selectedReport.rawContent.structured)}
                    </pre>
                  </div>
                )}
                
                {/* Verificar se tem conteúdo */}
                {(!selectedReport.rawContent || Object.keys(selectedReport.rawContent).length === 0 || 
                  (Object.values(selectedReport.rawContent).every(v => 
                    v === '' || v === null || v === undefined || 
                    (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) ||
                    (Array.isArray(v) && v.length === 0)
                  ))) ? (
                  <div className="text-center py-6">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-400 text-sm font-medium">Relatório sem dados clínicos</p>
                    <p className="text-slate-500 text-xs mt-1">Este relatório foi gerado sem dados da avaliação AEC.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-slate-300">
                    {/* Queixa Principal */}
                    {selectedReport.content.chiefComplaint && (
                      <div className="border-l-2 border-emerald-500/50 pl-3">
                        <strong className="text-emerald-400 text-xs uppercase tracking-wider">Queixa Principal</strong>
                        <p className="mt-1">{selectedReport.content.chiefComplaint}</p>
                      </div>
                    )}

                    {/* Lista Indiciária (AEC Etapa 2) */}
                    {selectedReport.rawContent?.lista_indiciaria && Array.isArray(selectedReport.rawContent.lista_indiciaria) && selectedReport.rawContent.lista_indiciaria.length > 0 && (
                      <div className="border-l-2 border-blue-500/50 pl-3">
                        <strong className="text-blue-400 text-xs uppercase tracking-wider">Lista Indiciária ({selectedReport.rawContent.lista_indiciaria.length} queixas)</strong>
                        <ul className="mt-1 space-y-1">
                          {selectedReport.rawContent.lista_indiciaria.map((item: any, i: number) => (
                            <li key={i} className="flex items-start space-x-2">
                              <span className="text-blue-400 mt-0.5">•</span>
                              <span>{stripListaIndiciariaItem(item)}</span>
                              {typeof item === 'object' && item.intensity && (
                                <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                                  {stripClinical(item.intensity)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Desenvolvimento da Queixa (AEC Etapa 4) */}
                    {selectedReport.rawContent?.desenvolvimento_queixa && (
                      <div className="border-l-2 border-purple-500/50 pl-3">
                        <strong className="text-purple-400 text-xs uppercase tracking-wider">Desenvolvimento da Queixa</strong>
                        <div className="mt-1 space-y-1">
                          {selectedReport.rawContent.desenvolvimento_queixa.descricao && (
                            <p>
                              <span className="text-slate-400">Descrição:</span>{' '}
                              {stripClinical(selectedReport.rawContent.desenvolvimento_queixa.descricao)}
                            </p>
                          )}
                          {selectedReport.rawContent.desenvolvimento_queixa.localizacao && (
                            <p>
                              <span className="text-slate-400">Localização:</span>{' '}
                              {stripClinical(selectedReport.rawContent.desenvolvimento_queixa.localizacao)}
                            </p>
                          )}
                          {selectedReport.rawContent.desenvolvimento_queixa.inicio && (
                            <p>
                              <span className="text-slate-400">Início:</span>{' '}
                              {stripClinical(selectedReport.rawContent.desenvolvimento_queixa.inicio)}
                            </p>
                          )}
                          {Array.isArray(selectedReport.rawContent.desenvolvimento_queixa.sintomas_associados) &&
                            selectedReport.rawContent.desenvolvimento_queixa.sintomas_associados.length > 0 && (
                            <p>
                              <span className="text-slate-400">Sintomas Associados:</span>{' '}
                              {stripClinicalList(selectedReport.rawContent.desenvolvimento_queixa.sintomas_associados).join(', ')}
                            </p>
                          )}
                          {Array.isArray(selectedReport.rawContent.desenvolvimento_queixa.fatores_melhora) &&
                            selectedReport.rawContent.desenvolvimento_queixa.fatores_melhora.length > 0 && (
                            <p>
                              <span className="text-green-400">▲ Melhora:</span>{' '}
                              {stripClinicalList(selectedReport.rawContent.desenvolvimento_queixa.fatores_melhora).join(', ')}
                            </p>
                          )}
                          {Array.isArray(selectedReport.rawContent.desenvolvimento_queixa.fatores_piora) &&
                            selectedReport.rawContent.desenvolvimento_queixa.fatores_piora.length > 0 && (
                            <p>
                              <span className="text-red-400">▼ Piora:</span>{' '}
                              {stripClinicalList(selectedReport.rawContent.desenvolvimento_queixa.fatores_piora).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* História (campo mapeado ou legado) */}
                    {selectedReport.content.history && (
                      <div className="border-l-2 border-amber-500/50 pl-3">
                        <strong className="text-amber-400 text-xs uppercase tracking-wider">História / Anamnese</strong>
                        <p className="mt-1">{selectedReport.content.history}</p>
                      </div>
                    )}

                    {/* História Patológica Pregressa (AEC Etapa 5) */}
                    {selectedReport.rawContent?.historia_patologica_pregressa && Array.isArray(selectedReport.rawContent.historia_patologica_pregressa) && selectedReport.rawContent.historia_patologica_pregressa.length > 0 && (
                      <div className="border-l-2 border-orange-500/50 pl-3">
                        <strong className="text-orange-400 text-xs uppercase tracking-wider">História Patológica Pregressa</strong>
                        <p className="mt-1">
                          {stripClinicalList(selectedReport.rawContent.historia_patologica_pregressa).join(', ')}
                        </p>
                      </div>
                    )}

                    {/* História Familiar */}
                    {selectedReport.rawContent?.historia_familiar && (
                      (Array.isArray(selectedReport.rawContent.historia_familiar.lado_materno) && selectedReport.rawContent.historia_familiar.lado_materno.length > 0) ||
                      (Array.isArray(selectedReport.rawContent.historia_familiar.lado_paterno) && selectedReport.rawContent.historia_familiar.lado_paterno.length > 0)
                    ) && (
                      <div className="border-l-2 border-pink-500/50 pl-3">
                        <strong className="text-pink-400 text-xs uppercase tracking-wider">História Familiar</strong>
                        <div className="mt-1 space-y-1">
                          {selectedReport.rawContent.historia_familiar.lado_materno?.length > 0 && (
                            <p>
                              <span className="text-slate-400">Materno:</span>{' '}
                              {stripClinicalList(selectedReport.rawContent.historia_familiar.lado_materno).join(', ')}
                            </p>
                          )}
                          {selectedReport.rawContent.historia_familiar.lado_paterno?.length > 0 && (
                            <p>
                              <span className="text-slate-400">Paterno:</span>{' '}
                              {stripClinicalList(selectedReport.rawContent.historia_familiar.lado_paterno).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Hábitos de Vida (AEC Etapa 7) */}
                    {selectedReport.rawContent?.habitos_vida && Array.isArray(selectedReport.rawContent.habitos_vida) && selectedReport.rawContent.habitos_vida.length > 0 && (
                      <div className="border-l-2 border-teal-500/50 pl-3">
                        <strong className="text-teal-400 text-xs uppercase tracking-wider">Hábitos de Vida</strong>
                        <p className="mt-1">{stripClinicalList(selectedReport.rawContent.habitos_vida).join(', ')}</p>
                      </div>
                    )}

                    {/* Perguntas Objetivas (AEC Etapa 6) */}
                    {selectedReport.rawContent?.perguntas_objetivas && typeof selectedReport.rawContent.perguntas_objetivas === 'object' && Object.keys(selectedReport.rawContent.perguntas_objetivas).length > 0 && (
                      <div className="border-l-2 border-cyan-500/50 pl-3">
                        <strong className="text-cyan-400 text-xs uppercase tracking-wider">Perguntas Objetivas</strong>
                        <div className="mt-1 space-y-1">
                          {Object.entries(selectedReport.rawContent.perguntas_objetivas).map(([key, val]: [string, any]) => (
                            val && (
                              <p key={key}>
                                <span className="text-slate-400">{key.replace(/_/g, ' ')}:</span> {stripClinical(val)}
                              </p>
                            )
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Consenso (AEC Etapa 9) */}
                    {selectedReport.rawContent?.consenso && (
                      <div className="border-l-2 border-indigo-500/50 pl-3">
                        <strong className="text-indigo-400 text-xs uppercase tracking-wider">Consenso</strong>
                        <p className="mt-1">
                          {selectedReport.rawContent.consenso.aceito ? '✅ Aceito pelo paciente' : '⏳ Pendente'} 
                          {selectedReport.rawContent.consenso.revisoes_realizadas > 0 && ` • ${selectedReport.rawContent.consenso.revisoes_realizadas} revisões`}
                        </p>
                      </div>
                    )}

                    {/* Dados legados IMRE (para relatórios antigos) */}
                    {selectedReport.rawContent?.investigation && (
                      <div className="border-l-2 border-slate-500/50 pl-3">
                        <strong className="text-slate-400 text-xs uppercase tracking-wider">Investigação (IMRE)</strong>
                        <p className="mt-1">{stripClinical(selectedReport.rawContent.investigation)}</p>
                      </div>
                    )}
                    {selectedReport.rawContent?.methodology && (
                      <div className="border-l-2 border-slate-500/50 pl-3">
                        <strong className="text-slate-400 text-xs uppercase tracking-wider">Metodologia (IMRE)</strong>
                        <p className="mt-1">{stripClinical(selectedReport.rawContent.methodology)}</p>
                      </div>
                    )}
                    {selectedReport.rawContent?.result && (
                      <div className="border-l-2 border-slate-500/50 pl-3">
                        <strong className="text-slate-400 text-xs uppercase tracking-wider">Resultado (IMRE)</strong>
                        <p className="mt-1">{stripClinical(selectedReport.rawContent.result)}</p>
                      </div>
                    )}
                    {selectedReport.rawContent?.evolution && (
                      <div className="border-l-2 border-slate-500/50 pl-3">
                        <strong className="text-slate-400 text-xs uppercase tracking-wider">Evolução (IMRE)</strong>
                        <p className="mt-1">{stripClinical(selectedReport.rawContent.evolution)}</p>
                      </div>
                    )}

                    {/* Scores se existirem (renderiza só métricas escalares — ignora arrays como `signals`) */}
                    {selectedReport.rawContent?.scores && (
                      <div className="border-l-2 border-emerald-500/50 pl-3">
                        <strong className="text-emerald-400 text-xs uppercase tracking-wider">Scores Calculados</strong>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {Object.entries(selectedReport.rawContent.scores)
                            .filter(([_, val]) => typeof val === 'number' || typeof val === 'string' || typeof val === 'boolean')
                            .map(([key, val]: [string, any]) => (
                              <div key={key} className="bg-slate-900/50 rounded px-2 py-1">
                                <span className="text-slate-400 text-xs">{key.replace(/_/g, ' ')}:</span>
                                <span className="text-emerald-300 ml-1 font-semibold">
                                  {typeof val === 'number' ? `${val}%` : String(val)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Avaliação e Plano (campos mapeados) */}
                    {selectedReport.content.assessment && (
                      <div className="border-l-2 border-amber-500/50 pl-3">
                        <strong className="text-amber-400 text-xs uppercase tracking-wider">Avaliação</strong>
                        <p className="mt-1">{selectedReport.content.assessment}</p>
                      </div>
                    )}
                    {selectedReport.content.plan && (
                      <div className="border-l-2 border-green-500/50 pl-3">
                        <strong className="text-green-400 text-xs uppercase tracking-wider">Plano</strong>
                        <p className="mt-1">{selectedReport.content.plan}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Conversa AEC Completa */}
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setShowConversation(!showConversation)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-700/30 transition-colors rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-sky-400" />
                    <h4 className="font-semibold text-slate-200">
                      Conversa AEC Completa ({conversationHistory.length} mensagens)
                    </h4>
                  </div>
                  {showConversation ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {showConversation && (
                  <div className="px-4 pb-4 max-h-96 overflow-y-auto space-y-3">
                    {loadingConversation ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="w-5 h-5 animate-spin text-sky-400 mr-2" />
                        <span className="text-slate-400 text-sm">Carregando conversa...</span>
                      </div>
                    ) : conversationHistory.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">Nenhuma mensagem encontrada para esta avaliação.</p>
                    ) : (
                      conversationHistory.map((msg, i) => (
                        <div key={i} className="space-y-1">
                          {msg.user_message && (
                            <div className="flex justify-end">
                              <div className="bg-sky-900/30 border border-sky-700/30 rounded-lg px-3 py-2 max-w-[80%]">
                                <span className="text-xs text-sky-400 font-medium">Paciente</span>
                                <p className="text-sm text-slate-200 mt-0.5">{stripClinical(msg.user_message)}</p>
                              </div>
                            </div>
                          )}
                          {msg.ai_response && (
                            <div className="flex justify-start">
                              <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-lg px-3 py-2 max-w-[80%]">
                                <span className="text-xs text-emerald-400 font-medium">Nôa</span>
                                <p className="text-sm text-slate-200 mt-0.5">
                                  {stripClinical((msg.ai_response || '').split('[ASSESSMENT_COMPLETED]')[0])}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Aplicar Racionalidades Médicas */}
              {!isPatient && (
                <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/20">
                  <h4 className="font-semibold text-slate-200 mb-3">Aplicar Racionalidades Médicas</h4>
                  <p className="text-sm text-slate-400 mb-3">
                    Selecione uma racionalidade médica para gerar uma análise específica deste relatório:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                    {[
                      { key: 'biomedical' as Rationality, label: 'Biomédica', icon: <Microscope className="w-4 h-4" /> },
                      { key: 'traditional_chinese' as Rationality, label: 'MTC', icon: <Leaf className="w-4 h-4" /> },
                      { key: 'ayurvedic' as Rationality, label: 'Ayurvédica', icon: <Zap className="w-4 h-4" /> },
                      { key: 'homeopathic' as Rationality, label: 'Homeopática', icon: <Target className="w-4 h-4" /> },
                      { key: 'integrative' as Rationality, label: 'Integrativa', icon: <Brain className="w-4 h-4" /> }
                    ].map(({ key, label, icon }) => {
                      const hasAnalysis = selectedReport?.content.rationalities?.[key === 'traditional_chinese' ? 'traditionalChinese' : key]
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            if (hasAnalysis) {
                              // Já existe → scroll até o card de análises
                              const el = document.getElementById('rationalities-results-card')
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                el.classList.add('ring-2', 'ring-emerald-400/60')
                                setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-400/60'), 1800)
                              }
                            } else {
                              handleApplyRationality(key)
                            }
                          }}
                          disabled={isGeneratingAnalysis}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${hasAnalysis
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer'
                            : isGeneratingAnalysis
                              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-800/50 border border-slate-600/30 text-slate-300 hover:bg-blue-900/20 hover:border-blue-500/30'
                            }`}
                          title={hasAnalysis ? 'Análise já gerada — clique para ver abaixo' : `Gerar análise ${label}`}
                        >
                          {icon}
                          <span>{label}</span>
                          {hasAnalysis && <CheckCircle className="w-4 h-4" />}
                        </button>
                      )
                    })}
                  </div>
                  {/* Modo Comparativo: aplica todas as racionalidades em sequência */}
                  <button
                    onClick={handleApplyAllRationalities}
                    disabled={isGeneratingAnalysis}
                    className={`w-full mb-2 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isGeneratingAnalysis
                        ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 text-emerald-300 hover:from-emerald-600/30 hover:to-teal-600/30'
                    }`}
                    title="Aplica as 5 racionalidades em sequência (visão integrativa completa)"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Modo Comparativo — Aplicar Todas</span>
                  </button>
                  {isGeneratingAnalysis && (
                    <div className="flex items-center space-x-2 text-blue-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando análise {selectedRationality && `(${selectedRationality})...`}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Racionalidades Aplicadas — Card visual rico estilo app */}
              {selectedReport && Object.entries(selectedReport.content.rationalities || {}).some(([_, value]: [string, any]) => {
                if (!value) return false
                return value.assessment || value.recommendations?.length || value.considerations || value.summary || value.content || value.analysis
              }) && (
                <div
                  id="rationalities-results-card"
                  className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-emerald-950/30 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,193,106,0.15)] transition-all duration-500"
                >
                  {/* Header com gradiente */}
                  <div className="px-5 py-4 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-600/10 via-teal-600/10 to-cyan-600/10 backdrop-blur-sm">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 flex items-center justify-center">
                          <Brain className="w-4.5 h-4.5 text-emerald-300" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white tracking-tight">Análises por Racionalidade</h4>
                          <p className="text-[11px] text-emerald-300/70 font-medium">
                            {Object.values(selectedReport.content.rationalities || {}).filter((v: any) => v && (v.assessment || v.recommendations?.length || v.considerations || v.summary || v.content || v.analysis)).length} de 5 racionalidades aplicadas
                          </p>
                        </div>
                      </div>
                      {!isPatient && Object.values(selectedReport.content.rationalities || {}).filter((v: any) => v?.assessment || v?.recommendations?.length).length > 1 && (
                        <button
                          onClick={handleDownloadAllRationalities}
                          className="group flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/40 text-emerald-200 hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-300/60 transition-all hover:scale-[1.02] active:scale-[0.98]"
                          title="Baixar todas as análises em um único arquivo comparativo"
                        >
                          <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                          <span>Baixar Comparativo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Grid de cards de análise */}
                  <div className="p-5 space-y-4">
                    {Object.entries(selectedReport.content.rationalities || {}).map(([key, value]: [string, any]) => {
                      if (!value) return null
                      const text = value.assessment || value.summary || value.content || value.analysis || ''
                      const recs = value.recommendations || []
                      const cons = value.considerations || ''
                      if (!text && !recs.length && !cons) return null

                      const meta: Record<string, { label: string; color: string; bg: string; border: string; ring: string }> = {
                        biomedical: { label: 'Biomédica', color: 'text-blue-300', bg: 'from-blue-500/10 to-cyan-500/5', border: 'border-blue-400/30', ring: 'ring-blue-400/20' },
                        traditionalChinese: { label: 'Medicina Tradicional Chinesa', color: 'text-amber-300', bg: 'from-amber-500/10 to-orange-500/5', border: 'border-amber-400/30', ring: 'ring-amber-400/20' },
                        ayurvedic: { label: 'Ayurvédica', color: 'text-fuchsia-300', bg: 'from-fuchsia-500/10 to-pink-500/5', border: 'border-fuchsia-400/30', ring: 'ring-fuchsia-400/20' },
                        homeopathic: { label: 'Homeopática', color: 'text-violet-300', bg: 'from-violet-500/10 to-purple-500/5', border: 'border-violet-400/30', ring: 'ring-violet-400/20' },
                        integrative: { label: 'Integrativa', color: 'text-emerald-300', bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-400/30', ring: 'ring-emerald-400/20' },
                      }
                      const m = meta[key] || { label: key, color: 'text-slate-300', bg: 'from-slate-500/10 to-slate-500/5', border: 'border-slate-500/30', ring: 'ring-slate-400/20' }

                      return (
                        <div
                          key={key}
                          className={`rounded-xl border ${m.border} bg-gradient-to-br ${m.bg} p-4 transition-all hover:ring-2 hover:${m.ring}`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-7 h-7 rounded-lg bg-slate-900/50 border ${m.border} flex items-center justify-center ${m.color}`}>
                              {getRationalityIcon(key)}
                            </div>
                            <h5 className={`font-bold text-sm ${m.color} tracking-tight`}>{m.label}</h5>
                          </div>

                          <div className="space-y-3 text-sm">
                            {text && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Avaliação</div>
                                <p className="text-slate-200 leading-relaxed">{stripClinical(text)}</p>
                              </div>
                            )}
                            {recs.length > 0 && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Recomendações</div>
                                <ul className="space-y-1">
                                  {recs.map((rec: string, idx: number) => (
                                    <li key={idx} className="flex gap-2 text-slate-200 leading-relaxed">
                                      <span className={`${m.color} mt-0.5`}>▸</span>
                                      <span>{stripClinical(rec)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {cons && (
                              <div>
                                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Considerações</div>
                                <p className="text-slate-200 leading-relaxed">{stripClinical(cons)}</p>
                              </div>
                            )}

                            {!isPatient && (
                              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-700/40">
                                <button
                                  onClick={() => handleDownloadRationality(key, value)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/60 border border-slate-600/40 text-slate-300 hover:bg-indigo-500/20 hover:border-indigo-400/40 hover:text-indigo-200 transition-all"
                                  title="Baixar esta análise (.txt)"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Baixar</span>
                                </button>
                                <button
                                  onClick={() => handleShareRationality(key, value)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/60 border border-slate-600/40 text-slate-300 hover:bg-sky-500/20 hover:border-sky-400/40 hover:text-sky-200 transition-all"
                                  title="Compartilhar esta análise"
                                >
                                  <Share2 className="w-3 h-3" />
                                  <span>Compartilhar</span>
                                </button>
                                <button
                                  onClick={() => selectedReport && handleGenerateNFT(selectedReport)}
                                  disabled={nftLoading}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800/60 border border-slate-600/40 text-slate-300 hover:bg-amber-500/20 hover:border-amber-400/40 hover:text-amber-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                  title="Registrar como NFT"
                                >
                                  {nftLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <QrCode className="w-3 h-3" />}
                                  <span>{nftLoading ? '...' : 'NFT'}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Notas do Médico */}
              {!isPatient && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Suas Notas e Observações:
                    {/* V1.9.242 — texto inline visivel (proposta Ricardo 13/05):
                        em vez de tooltip oculto no botao, indicacao clara do que falta. */}
                    {(doctorNotes || '').trim().length < 3 && selectedReport?.reviewStatus !== 'approved' && (
                      <span className="ml-2 text-xs font-normal text-amber-300/90">
                        — Escreva uma nota (mínimo 3 caracteres) para liberar a devolução ao paciente
                      </span>
                    )}
                  </label>
                  <textarea
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Digite suas observações sobre este relatório..."
                    className="w-full h-32 p-3 bg-slate-800/50 border border-slate-600/30 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-[#00C16A]/50 focus:border-[#00C16A]/30 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Ações do Modal */}
            <div className="flex flex-wrap gap-2 mt-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="flex-1 min-w-[120px] px-4 py-2 border border-slate-600/30 text-slate-300 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                Fechar
              </button>
              {/* V1.9.244 — Footer focado em fluxo clinico (Ricardo+GPT+Pedro 13/05):
                  Baixar foi pro header (icone utilitario). NFT removido (acao do paciente,
                  nao do medico — RLS de patient_nfts permite medico VER via galeria, nao
                  GERAR). Marcar revisado escondido (codigo morto: 0 reports usaram empiricamente).
                  CTA dominante unico = "Aprovar e devolver" (verde). */}

              {/* V1.9.243 — Agendar consulta: unica acao nova pro paciente no modal
                  (card so apresenta estado; modal abre fluxos novos). */}
              {isPatient && (
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    navigate('/app/clinica/paciente/agendamentos', {
                      state: { openNew: true, reason: 'post_assessment' }
                    })
                  }}
                  className="flex-1 min-w-[140px] px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                  style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
                  title="Abrir tela de agendamento de consulta"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Agendar consulta</span>
                </button>
              )}

              {!isPatient && (
                <>
                  <button
                    onClick={() => handleReviewReport(selectedReport.id, 'approved')}
                    disabled={
                      isApprovingReport ||
                      (doctorNotes || '').trim().length < 3 ||
                      selectedReport.reviewStatus === 'approved'
                    }
                    className="flex-1 min-w-[160px] px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)' }}
                    title={
                      selectedReport.reviewStatus === 'approved'
                        ? 'Já aprovado e devolvido ao paciente — devolução é imutável (CFM 2.314)'
                        : (doctorNotes || '').trim().length < 3
                        ? 'Escreva uma nota clínica para o paciente antes de aprovar'
                        : 'Aprovar e devolver ao paciente — registra revisão clínica e notifica o paciente'
                    }
                  >
                    {isApprovingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span>
                      {isApprovingReport ? 'Devolvendo...' :
                        selectedReport.reviewStatus === 'approved' ? 'Já aprovado' :
                        'Aprovar e devolver'}
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal NFT — V1.9.197: copy correto (sem "blockchain"), CTA Ver na Galeria */}
      {nftModal.show && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nft-modal-title"
          onKeyDown={(e) => { if (e.key === 'Escape') setNftModal({ show: false, token: '', hash: '' }) }}
        >
          <div
            className="rounded-2xl p-7 max-w-md w-full border text-center animate-in fade-in zoom-in-95 duration-200"
            style={{
              background: 'rgba(7, 22, 41, 0.95)',
              borderColor: 'rgba(147, 51, 234, 0.3)',
              boxShadow: '0 24px 64px rgba(147, 51, 234, 0.15)'
            }}
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #9333ea 100%)' }}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 id="nft-modal-title" className="text-xl font-bold text-white mb-2">Assinatura Visual Gerada</h3>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Sua assinatura simbólica única foi gerada e ancorada criptograficamente
              ao relatório clínico de origem.
            </p>
            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(147, 51, 234, 0.15)' }}>
                <span className="text-slate-400 text-xs">Identificador</span>
                <span className="text-purple-400 font-mono text-xs font-semibold">{nftModal.token}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                <span className="text-slate-400 text-xs">Hash imagem</span>
                <span className="text-emerald-400 font-mono text-xs font-semibold">{nftModal.hash}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setNftModal({ show: false, token: '', hash: '' })}
                className="flex-1 px-4 py-2.5 rounded-xl text-slate-300 font-medium transition-all hover:bg-slate-800"
                style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)' }}
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setNftModal({ show: false, token: '', hash: '' })
                  navigate('/app/clinica/paciente/dashboard?section=galeria')
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #9333ea 100%)' }}
              >
                <Sparkles className="w-4 h-4" />
                Ver na Galeria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicalReports
