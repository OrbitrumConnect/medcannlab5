import React from 'react'
import { FlaskConical, ChevronDown, Printer, Send } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import DotPagination from '../../ui/DotPagination'

/**
 * V1.9.233 — PatientExamRequestsCard
 *
 * Card "Exames Solicitados" extraído de PatientAnalytics.tsx (linhas 1392-1534)
 * pra ser reutilizável em 2+ rotas:
 *   - PatientDashboard ?section=analytics (via PatientAnalytics — passa props)
 *   - PatientDashboard ?section=minhas-prescricoes (via PatientPrescriptions — autônomo)
 *
 * Modo HÍBRIDO:
 *   - Se props (examRequests, loading) passados → controlled (usa external state)
 *   - Se NÃO passados → autônomo (faz própria query patient_exam_requests)
 *
 * Anti-regressão:
 *   - JSX/state/handlers idênticos ao inline anterior (zero divergência UX)
 *   - Mesma query: patient_exam_requests filtrado por user.id, order desc, limit 20
 *   - Mesma paginação (5 per page) + accordion (1 expanded por vez)
 *   - Handlers print/whatsapp preservados (UX existente)
 */

export interface ExamRequestRow {
  id: string
  content: string
  status: string
  created_at: string
}

interface PatientExamRequestsCardProps {
  /**
   * Modo controlled: lista pré-carregada (ex: PatientAnalytics).
   * Se omitido, componente busca sozinho (modo autônomo).
   */
  examRequests?: ExamRequestRow[]
  /**
   * Modo controlled: estado de loading externo.
   * Ignorado em modo autônomo.
   */
  loading?: boolean
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-brand-text-muted', dot: 'bg-slate-400', bg: 'bg-slate-400/10' },
  pending: { label: 'Pendente', color: 'text-amber-400', dot: 'bg-amber-400', bg: 'bg-amber-400/10' },
  sent: { label: 'Enviado', color: 'text-blue-400', dot: 'bg-blue-400', bg: 'bg-blue-400/10' },
  completed: { label: 'Concluído', color: 'text-emerald-400', dot: 'bg-emerald-400', bg: 'bg-emerald-400/10' },
}

const EXAM_PAGE_SIZE = 5

const PatientExamRequestsCard: React.FC<PatientExamRequestsCardProps> = ({
  examRequests: externalExams,
  loading: externalLoading,
}) => {
  const { user } = useAuth()
  const isAutonomous = externalExams === undefined

  // Estado interno (modo autônomo)
  const [internalExams, setInternalExams] = React.useState<ExamRequestRow[]>([])
  const [internalLoading, setInternalLoading] = React.useState(false)
  const [examPage, setExamPage] = React.useState(1)
  const [expandedExamId, setExpandedExamId] = React.useState<string | null>(null)

  // Carrega exames se autônomo
  React.useEffect(() => {
    if (!isAutonomous) return
    if (!user?.id) return
    const fetchExamRequests = async () => {
      setInternalLoading(true)
      try {
        const { data, error } = await supabase
          .from('patient_exam_requests')
          .select('id, content, status, created_at')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)
        if (error) throw error
        setInternalExams(
          (data || []).map((d: any) => ({
            ...d,
            status: d.status ?? 'draft',
            created_at: d.created_at ?? new Date().toISOString(),
          }))
        )
      } catch (err) {
        console.error('[PatientExamRequestsCard] Erro ao buscar exames:', err)
      } finally {
        setInternalLoading(false)
      }
    }
    fetchExamRequests()
  }, [isAutonomous, user?.id])

  const examRequests = isAutonomous ? internalExams : (externalExams || [])
  const examRequestsLoading = isAutonomous ? internalLoading : !!externalLoading

  const examTotalPages = Math.max(1, Math.ceil(examRequests.length / EXAM_PAGE_SIZE))
  const safeExamPage = Math.min(Math.max(1, examPage), examTotalPages)
  const pagedExams = examRequests.slice((safeExamPage - 1) * EXAM_PAGE_SIZE, safeExamPage * EXAM_PAGE_SIZE)

  const handlePrintExam = (content: string) => {
    const w = window.open('', '', 'width=800,height=600')
    if (w) {
      w.document.write(`<html><head><title>Solicitação de Exame</title><style>body{font-family:'Segoe UI',sans-serif;padding:40px;color:#333;white-space:pre-wrap;line-height:1.6}.header{text-align:center;margin-bottom:30px;border-bottom:2px solid #000;padding-bottom:15px}.logo{font-size:22px;font-weight:bold}</style></head><body><div class="header"><div class="logo">MedCannLab</div><p>Solicitação de Exames</p><p>${new Date().toLocaleDateString('pt-BR')}</p></div><div>${content}</div></body></html>`)
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 500)
    }
  }

  const handleShareWhatsApp = (content: string) => {
    const text = `*Solicitação de Exame - MedCannLab*\n\n${content}\n\n_Data: ${new Date().toLocaleDateString('pt-BR')}_`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-brand-text">Exames Solicitados</h3>
            <p className="text-[11px] text-brand-text-muted">Clique para expandir • Imprima ou compartilhe</p>
          </div>
        </div>
        {examRequests.length > 0 && (
          <span className="text-xs text-slate-500 bg-slate-800/60 px-3 py-1 rounded-full border border-slate-700/50">
            {examRequests.length} total
          </span>
        )}
      </div>

      {/* Rows */}
      {examRequestsLoading ? (
        <div className="flex items-center gap-3 py-6 justify-center text-brand-text-muted">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400" />
          <span className="text-sm">Carregando…</span>
        </div>
      ) : examRequests.length > 0 ? (
        <div className="divide-y divide-slate-700/40">
          {pagedExams.map((req, idx) => {
            const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.draft
            const isExpanded = expandedExamId === req.id
            const preview = req.content.split('\n')[0].substring(0, 80)
            return (
              <div key={req.id}>
                {/* Collapsed row — clickable */}
                <div
                  className="px-5 py-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpandedExamId(isExpanded ? null : req.id)}
                >
                  <span className="w-6 h-6 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 text-xs font-bold border border-cyan-500/20 flex-shrink-0">
                    {(safeExamPage - 1) * EXAM_PAGE_SIZE + idx + 1}
                  </span>
                  <p className="text-sm text-slate-200 font-medium truncate flex-1">{preview}{req.content.length > 80 ? '…' : ''}</p>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:inline">{new Date(req.created_at).toLocaleDateString('pt-BR')}</span>
                  <div className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${st.color} ${st.bg} border-current/20 whitespace-nowrap`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                    <span className="font-medium">{st.label}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 bg-slate-900/40 border-t border-slate-700/30">
                    <pre className="text-sm text-brand-text-secondary whitespace-pre-wrap leading-relaxed font-sans max-h-64 overflow-y-auto custom-scrollbar">{req.content}</pre>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrintExam(req.content) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-brand-surface hover:bg-brand-surface-subtle border border-slate-600/50 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(req.content) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-lg transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                      <span className="text-[11px] text-slate-500 ml-auto">
                        {new Date(req.created_at).toLocaleDateString('pt-BR')} às {new Date(req.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <FlaskConical className="w-8 h-8 text-cyan-400 opacity-30 mx-auto mb-3" />
          <p className="text-sm text-brand-text-muted">Nenhuma solicitação de exame encontrada</p>
        </div>
      )}

      {/* V1.9.234: paginação dots reutilizável (mesmo padrão dos cards profissionais agendamento) */}
      {examTotalPages > 1 && (
        <div className="px-5 py-3 border-t border-slate-700/50 bg-slate-900/20">
          <DotPagination
            currentPage={safeExamPage}
            totalPages={examTotalPages}
            onPageChange={setExamPage}
          />
        </div>
      )}
    </div>
  )
}

export default PatientExamRequestsCard
