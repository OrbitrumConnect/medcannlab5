import React, { useState, useEffect, useCallback } from 'react'
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
  ChevronUp
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { stripPlatformInjectionNoise } from '../lib/clinicalAssessmentFlow'

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
}

interface ClinicalReportsProps {
  className?: string
  onShareReport?: (reportId: string) => void
}

const REPORTS_PER_PAGE = 5

const ClinicalReports: React.FC<ClinicalReportsProps> = ({ className = '', onShareReport }) => {
  const { user } = useAuth()
  const { getEffectiveUserType, isAdminViewingAs } = useUserView()
  const [reports, setReports] = useState<SharedReport[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<SharedReport | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'shared' | 'reviewed' | 'validated'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const effectiveType = getEffectiveUserType(user?.type)
  const isUserAdmin = effectiveType === 'admin'
  const isPatient = effectiveType === 'paciente'
  const [selectedRationality, setSelectedRationality] = useState<Rationality | null>(null)
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false)
  const [nftModal, setNftModal] = useState<{ show: boolean; token: string; hash: string }>({ show: false, token: '', hash: '' })
  const [appliedRationalities, setAppliedRationalities] = useState<Set<Rationality>>(new Set())
  const [conversationHistory, setConversationHistory] = useState<Array<{ user_message: string; ai_response: string; created_at: string }>>([])
  const [loadingConversation, setLoadingConversation] = useState(false)
  const [showConversation, setShowConversation] = useState(false)

  const fetchConversation = useCallback(async (patientId: string, reportDate?: string) => {
    setLoadingConversation(true)
    setConversationHistory([])
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

      setConversationHistory(aecMessages)
    } catch (err) {
      console.error('Erro ao carregar conversa:', err)
    } finally {
      setLoadingConversation(false)
    }
  }, [])

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
        const content: Record<string, any> = nested
          ? { ...nested, structured: rawDb.structured, scores: nested.scores || rawDb.raw?.scores, risk_level: rawDb.raw?.risk_level }
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
            rationalities: (content.rationalities as SharedReport['content']['rationalities']) || {
              biomedical: {},
              traditionalChinese: {},
              ayurvedic: {},
              homeopathic: {},
              integrative: {}
            }
          },
          doctorNotes: stripClinical(content.doctor_notes) || undefined,
          reviewStatus: (content.review_status as SharedReport['reviewStatus']) || 'pending',
          rawContent: content
        }
      })

      setReports(formattedReports)
    } catch (error) {
      console.error('❌ Erro ao carregar relatórios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewReport = async (reportId: string, status: 'reviewed' | 'approved') => {
    try {
      const { error } = await supabase
        .from('clinical_reports')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) {
        console.error('❌ Erro ao revisar relatório:', error)
        return
      }

      console.log('✅ Relatório revisado com sucesso')
      loadSharedReports() // Recarregar dados
      setShowReportModal(false)
      setDoctorNotes('')
    } catch (error) {
      console.error('❌ Erro ao revisar relatório:', error)
    }
  }

  const handleDownloadReport = (report: SharedReport) => {
    try {
      const raw = report.rawContent || {}
      const lines: string[] = [
        `RELATÓRIO CLÍNICO — ${report.patientName}`,
        `Data: ${new Date(report.date).toLocaleDateString('pt-BR')}`,
        `Tipo: Avaliação Clínica Inicial (AEC 001)`,
        `Protocolo: IMRE`,
        `Status: ${report.status}`,
        '',
        '═══════════════════════════════════════',
      ]

      // AEC Data (full)
      if (report.content.chiefComplaint) {
        lines.push('', '▸ QUEIXA PRINCIPAL:', report.content.chiefComplaint)
      }

      if (raw.lista_indiciaria && Array.isArray(raw.lista_indiciaria) && raw.lista_indiciaria.length > 0) {
        lines.push('', `▸ LISTA INDICIÁRIA (${raw.lista_indiciaria.length} queixas):`)
        raw.lista_indiciaria.forEach((item: any, i: number) => {
          lines.push(`  ${i + 1}. ${stripListaIndiciariaItem(item)}`)
          if (typeof item === 'object' && item.intensity) lines.push(`     Intensidade: ${stripClinical(item.intensity)}`)
          if (typeof item === 'object' && item.frequency) lines.push(`     Frequência: ${stripClinical(item.frequency)}`)
        })
      }

      if (raw.desenvolvimento_queixa) {
        const dq = raw.desenvolvimento_queixa
        lines.push('', '▸ DESENVOLVIMENTO DA QUEIXA:')
        if (dq.descricao) lines.push(`  Descrição: ${stripClinical(dq.descricao)}`)
        if (dq.localizacao) lines.push(`  Localização: ${stripClinical(dq.localizacao)}`)
        if (dq.inicio) lines.push(`  Início: ${stripClinical(dq.inicio)}`)
        if (Array.isArray(dq.sintomas_associados) && dq.sintomas_associados.length) {
          lines.push(`  Sintomas Associados: ${stripClinicalList(dq.sintomas_associados).join(', ')}`)
        }
        if (Array.isArray(dq.fatores_melhora) && dq.fatores_melhora.length) {
          lines.push(`  Fatores de Melhora: ${stripClinicalList(dq.fatores_melhora).join(', ')}`)
        }
        if (Array.isArray(dq.fatores_piora) && dq.fatores_piora.length) {
          lines.push(`  Fatores de Piora: ${stripClinicalList(dq.fatores_piora).join(', ')}`)
        }
      }

      if (report.content.history) {
        lines.push('', '▸ HISTÓRIA / ANAMNESE:', report.content.history)
      }

      if (raw.historia_patologica_pregressa && Array.isArray(raw.historia_patologica_pregressa) && raw.historia_patologica_pregressa.length) {
        lines.push('', '▸ HISTÓRIA PATOLÓGICA PREGRESSA:', `  ${stripClinicalList(raw.historia_patologica_pregressa).join(', ')}`)
      }

      if (raw.historia_familiar) {
        const hf = raw.historia_familiar
        if ((hf.lado_materno?.length) || (hf.lado_paterno?.length)) {
          lines.push('', '▸ HISTÓRIA FAMILIAR:')
          if (hf.lado_materno?.length) lines.push(`  Materno: ${stripClinicalList(hf.lado_materno).join(', ')}`)
          if (hf.lado_paterno?.length) lines.push(`  Paterno: ${stripClinicalList(hf.lado_paterno).join(', ')}`)
        }
      }

      if (raw.habitos_vida && Array.isArray(raw.habitos_vida) && raw.habitos_vida.length) {
        lines.push('', '▸ HÁBITOS DE VIDA:', `  ${stripClinicalList(raw.habitos_vida).join(', ')}`)
      }

      if (raw.perguntas_objetivas && typeof raw.perguntas_objetivas === 'object' && Object.keys(raw.perguntas_objetivas).length) {
        lines.push('', '▸ PERGUNTAS OBJETIVAS:')
        Object.entries(raw.perguntas_objetivas).forEach(([k, v]: [string, any]) => {
          if (v) lines.push(`  ${k.replace(/_/g, ' ')}: ${stripClinical(v)}`)
        })
      }

      if (raw.consenso) {
        lines.push('', '▸ CONSENSO:', `  ${raw.consenso.aceito ? 'Aceito pelo paciente' : 'Pendente'}${raw.consenso.revisoes_realizadas > 0 ? ` • ${raw.consenso.revisoes_realizadas} revisões` : ''}`)
      }

      // Legacy IMRE fields
      if (raw.investigation) lines.push('', '▸ INVESTIGAÇÃO (IMRE):', stripClinical(raw.investigation))
      if (raw.methodology) lines.push('', '▸ METODOLOGIA (IMRE):', stripClinical(raw.methodology))
      if (raw.result) lines.push('', '▸ RESULTADO (IMRE):', stripClinical(raw.result))
      if (raw.evolution) lines.push('', '▸ EVOLUÇÃO (IMRE):', stripClinical(raw.evolution))

      if (report.content.assessment) lines.push('', '▸ AVALIAÇÃO:', report.content.assessment)
      if (report.content.plan) lines.push('', '▸ PLANO TERAPÊUTICO:', report.content.plan)

      // Scores
      if (raw.scores) {
        lines.push('', '▸ SCORES:')
        Object.entries(raw.scores).forEach(([k, v]: [string, any]) => {
          lines.push(`  ${k.replace(/_/g, ' ')}: ${v}%`)
        })
      }

      lines.push('', '═══════════════════════════════════════', '', '▸ RACIONALIDADES MÉDICAS APLICADAS:')
      Object.entries(report.content.rationalities || {}).forEach(([key, value]: [string, any]) => {
        if (value?.assessment) {
          lines.push(`  • ${key}: ${stripClinical(value.assessment)}`)
          if (value.recommendations) lines.push(`    Recomendações: ${stripClinical(value.recommendations)}`)
        }
      })

      // Conversa AEC completa
      if (conversationHistory.length > 0) {
        lines.push('', '═══════════════════════════════════════', '', '▸ CONVERSA AEC COMPLETA:', '')
        conversationHistory.forEach((msg) => {
          const cleanMsg = stripClinical(msg.user_message || '')
          const cleanResp = stripClinical((msg.ai_response || '').split('[ASSESSMENT_COMPLETED]')[0])
          if (cleanMsg) lines.push(`PACIENTE: ${cleanMsg}`)
          if (cleanResp) lines.push(`NÔA: ${cleanResp}`)
          lines.push('---')
        })
      }

      if (report.nftToken) {
        lines.push('', `NFT Token: ${report.nftToken}`)
        if (report.blockchainHash) lines.push(`Hash: ${report.blockchainHash}`)
      }

      lines.push('', '', `Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`)
      lines.push('Plataforma: MedCannLab — Nôa Esperanza')

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_${report.patientName.replace(/\s+/g, '_')}_${new Date(report.date).toISOString().slice(0, 10)}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao baixar relatório:', error)
    }
  }

  const handleGenerateNFT = async (report: SharedReport) => {
    try {
      console.log('Gerando NFT para relatório:', report.id)
      const token = `NFT-${Date.now()}`
      const hash = `0x${Math.random().toString(16).substr(2, 8)}`
      setNftModal({ show: true, token, hash })
    } catch (error) {
      console.error('Erro ao gerar NFT:', error)
    }
  }

  const handleApplyRationality = async (rationality: Rationality) => {
    if (!selectedReport || !user) {
      alert('Erro: Relatório ou usuário não encontrado.')
      return
    }

    try {
      setIsGeneratingAnalysis(true)
      setSelectedRationality(rationality)

      // Gerar análise
      const analysis = await rationalityAnalysisService.generateAnalysis(
        selectedReport.content,
        rationality,
        user.id,
        user.email
      )

      // Salvar no relatório
      await rationalityAnalysisService.saveAnalysisToReport(
        selectedReport.id,
        rationality,
        analysis
      )

      // Recarregar relatórios para atualizar a UI
      await loadSharedReports()

      // Atualizar selectedReport com a nova análise
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

      // Success - UI already updated
    } catch (error) {
      console.error('Erro ao aplicar racionalidade:', error)
    } finally {
      setIsGeneratingAnalysis(false)
      setSelectedRationality(null)
    }
  }

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true
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
          <div>
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center space-x-2">
              <FileText className="w-6 h-6 text-[#00C16A]" />
              <span>{isPatient ? 'Meus Relatórios Clínicos' : isUserAdmin ? 'Todos os Relatórios Clínicos' : 'Relatórios da Avaliação Clínica Inicial'}</span>
            </h2>
            <p className="text-[#C8D6E5]">
              {isPatient ? 'Seus relatórios de avaliação clínica' : isUserAdmin ? 'Visão administrativa de todos os relatórios' : 'Relatórios compartilhados pelos pacientes com você'}
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
                  <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm border ${
                    report.status === 'shared' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    report.status === 'reviewed' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    report.status === 'validated' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {getStatusIcon(report.status)}
                    <span className="capitalize">{report.status === 'shared' ? 'Compartilhado' : report.status === 'reviewed' ? 'Revisado' : report.status === 'validated' ? 'Validado' : report.status === 'completed' ? 'Completo' : report.status}</span>
                  </span>
                  {report.nftToken && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      NFT: {report.nftToken}
                    </span>
                  )}
                </div>
              </div>

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
                  onClick={() => {
                    setSelectedReport(report)
                    setDoctorNotes(report.doctorNotes || '')
                    setShowReportModal(true)
                    setShowConversation(false)
                    fetchConversation(report.patientId, report.date)
                    const applied = new Set<Rationality>()
                    Object.entries(report.content.rationalities || {}).forEach(([key, value]: [string, any]) => {
                      if (value && value.assessment) {
                        const rationalityKey = key === 'traditionalChinese' ? 'traditional_chinese' : key
                        applied.add(rationalityKey as Rationality)
                      }
                    })
                    setAppliedRationalities(applied)
                  }}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white"
                  style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}
                >
                  <Eye className="w-4 h-4" />
                  <span>Revisar</span>
                </button>
                {isPatient && onShareReport && (
                  <button
                    onClick={() => onShareReport(report.id)}
                    className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white"
                    style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)' }}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Compartilhar</span>
                  </button>
                )}
                <button
                  onClick={() => handleGenerateNFT(report)}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white"
                  style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}
                >
                  <QrCode className="w-4 h-4" />
                  <span>Gerar NFT</span>
                </button>
                <button
                  onClick={() => handleDownloadReport(report)}
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors text-white bg-slate-600/50 border border-slate-500/30 hover:bg-slate-600/80"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
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
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            {isPatient ? 'Nenhum relatório encontrado' : 'Nenhum relatório compartilhado'}
          </h3>
          <p className="text-slate-500">
            {isPatient
              ? 'Você ainda não possui relatórios de avaliação clínica. Converse com a Nôa para iniciar sua avaliação.'
              : isUserAdmin
                ? 'Ainda não existem relatórios clínicos na plataforma.'
                : 'Os pacientes ainda não compartilharam relatórios de avaliação clínica inicial com você.'}
          </p>
        </div>
      )}

      {/* Modal de Revisão */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto border"
            style={{
              background: 'rgba(7, 22, 41, 0.95)',
              borderColor: 'rgba(0, 193, 106, 0.15)',
              boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Revisar Relatório - {selectedReport.patientName}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Conteúdo Completo do Relatório AEC */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                <h4 className="font-semibold text-slate-200 mb-3">Conteúdo do Relatório:</h4>
                
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

                    {/* Scores se existirem */}
                    {selectedReport.rawContent?.scores && (
                      <div className="border-l-2 border-emerald-500/50 pl-3">
                        <strong className="text-emerald-400 text-xs uppercase tracking-wider">Scores Calculados</strong>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          {Object.entries(selectedReport.rawContent.scores).map(([key, val]: [string, any]) => (
                            <div key={key} className="bg-slate-900/50 rounded px-2 py-1">
                              <span className="text-slate-400 text-xs">{key.replace(/_/g, ' ')}:</span>
                              <span className="text-emerald-300 ml-1 font-semibold">{val}%</span>
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
                          onClick={() => handleApplyRationality(key)}
                          disabled={isGeneratingAnalysis || hasAnalysis}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${hasAnalysis
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default'
                            : isGeneratingAnalysis
                              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-800/50 border border-slate-600/30 text-slate-300 hover:bg-blue-900/20 hover:border-blue-500/30'
                            }`}
                        >
                          {icon}
                          <span>{label}</span>
                          {hasAnalysis && <CheckCircle className="w-4 h-4" />}
                        </button>
                      )
                    })}
                  </div>
                  {isGeneratingAnalysis && (
                    <div className="flex items-center space-x-2 text-blue-400 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gerando análise {selectedRationality && `(${selectedRationality})...`}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Racionalidades Aplicadas */}
              {selectedReport && Object.entries(selectedReport.content.rationalities || {}).some(([_, value]: [string, any]) => value && value.assessment) && (
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <h4 className="font-semibold text-slate-200 mb-3">Análises por Racionalidade:</h4>
                  <div className="space-y-4">
                    {Object.entries(selectedReport.content.rationalities || {}).map(([key, value]: [string, any]) => {
                      if (!value || !value.assessment) return null
                      const rationalityLabel = key === 'traditionalChinese' ? 'Medicina Tradicional Chinesa' :
                        key === 'biomedical' ? 'Biomédica' :
                          key === 'ayurvedic' ? 'Ayurvédica' :
                            key === 'homeopathic' ? 'Homeopática' :
                              key === 'integrative' ? 'Integrativa' : key
                      return (
                        <div key={key} className="border-l-4 border-[#00C16A] pl-4">
                          <div className="flex items-center space-x-2 mb-2">
                            {getRationalityIcon(key)}
                            <h5 className="font-semibold text-slate-200">{rationalityLabel}</h5>
                          </div>
                          <div className="text-sm text-slate-300 space-y-2">
                            <div>
                              <strong className="text-slate-200">Avaliação:</strong>
                              <p className="mt-1">{stripClinical(value.assessment)}</p>
                            </div>
                            {value.recommendations && value.recommendations.length > 0 && (
                              <div>
                                <strong className="text-slate-200">Recomendações:</strong>
                                <ul className="mt-1 list-disc list-inside">
                                  {value.recommendations.map((rec: string, idx: number) => (
                                    <li key={idx}>{stripClinical(rec)}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {value.considerations && (
                              <div>
                                <strong className="text-slate-200">Considerações:</strong>
                                <p className="mt-1">{stripClinical(value.considerations)}</p>
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
              <button
                onClick={() => handleDownloadReport(selectedReport)}
                className="flex-1 min-w-[120px] px-4 py-2 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
              >
                <Download className="w-4 h-4" />
                <span>Baixar</span>
              </button>
              {!isPatient && (
                <>
                  <button
                    onClick={() => handleReviewReport(selectedReport.id, 'reviewed')}
                    className="flex-1 min-w-[120px] px-4 py-2 text-white rounded-lg transition-colors"
                    style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
                  >
                    Revisado
                  </button>
                  <button
                    onClick={() => handleReviewReport(selectedReport.id, 'approved')}
                    className="flex-1 min-w-[120px] px-4 py-2 text-white rounded-lg transition-colors"
                    style={{ background: 'linear-gradient(135deg, #00C16A 0%, #13794f 100%)' }}
                  >
                    Aprovar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal NFT */}
      {nftModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="rounded-2xl p-8 max-w-md w-full mx-4 border text-center"
            style={{
              background: 'rgba(7, 22, 41, 0.95)',
              borderColor: 'rgba(147, 51, 234, 0.3)',
              boxShadow: '0 24px 64px rgba(147, 51, 234, 0.15)'
            }}
          >
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}>
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">NFT Gerado com Sucesso!</h3>
            <p className="text-slate-400 text-sm mb-6">Certificado de autenticidade do relatório clínico registrado em blockchain.</p>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(147, 51, 234, 0.15)' }}>
                <span className="text-slate-400 text-sm">Token</span>
                <span className="text-purple-400 font-mono text-sm font-semibold">{nftModal.token}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: 'rgba(15, 36, 60, 0.7)', border: '1px solid rgba(147, 51, 234, 0.15)' }}>
                <span className="text-slate-400 text-sm">Hash</span>
                <span className="text-purple-400 font-mono text-sm font-semibold">{nftModal.hash}</span>
              </div>
            </div>
            <button
              onClick={() => setNftModal({ show: false, token: '', hash: '' })}
              className="w-full px-4 py-3 rounded-xl text-white font-medium transition-all"
              style={{ background: 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicalReports
