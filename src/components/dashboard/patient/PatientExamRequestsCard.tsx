import React from 'react'
import { FlaskConical, ChevronDown, Printer, Send, Download, ShieldCheck, AlertCircle, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'
import { supabase } from '../../../lib/supabase'
import DotPagination from '../../ui/DotPagination'

/**
 * V1.9.233 — PatientExamRequestsCard
 * V1.9.455 (26/05/2026) — Wiring ICP-Brasil PDF binário (PARTE B).
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
 * V1.9.455 — Espelha padrão `PatientPrescriptions.tsx:486-538` (polir-não-inventar):
 *   - Badge "ICP" quando digital_signature populado
 *   - Botão "Baixar PDF assinado" quando signed_pdf_url V1.9.299 existir
 *   - Banner amarelo quando signed mas sem PDF (legado pré-V1.9.299)
 *   - Guard isFictitiousItiUrl() esconde URL ITI fake (gov.br/iti/...codigo=)
 *   - "WhatsApp link" usa signed URL Storage TTL 7d (Ariane abre direto)
 *   - Handlers existentes (handlePrintExam, handleShareWhatsApp texto) preservados
 *
 * Anti-regressão:
 *   - JSX/state/handlers anteriores intocados
 *   - Mesma paginação (5 per page) + accordion (1 expanded por vez)
 *   - Botões ICP só renderizam condicionalmente (não substitui UX existente)
 */

export interface ExamRequestRow {
  id: string
  content: string
  status: string
  created_at: string
  // V1.9.455: campos ICP-Brasil (opcional p/ backward-compat modo controlled)
  digital_signature?: string | null
  signed_pdf_url?: string | null
  iti_validation_url?: string | null
  signature_timestamp?: string | null
  professional_id?: string | null
}

// V1.9.455: detecta URLs fictícias geradas antes de V1.9.298 (15/05).
// Espelho de PatientPrescriptions.tsx:99-102.
// Domínio `validacao.iti.gov.br` (sem `r` no fim) ou `gov.br/iti/pt-br/validacao?codigo=` NÃO existem.
// O validador oficial é `validar.iti.gov.br` (exige upload de PDF binário).
function isFictitiousItiUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /validacao\.iti\.gov\.br|gov\.br\/iti\/pt-br\/validacao\?codigo/i.test(url)
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
  draft: { label: 'Rascunho', color: 'text-slate-400', dot: 'bg-slate-400', bg: 'bg-slate-400/10' },
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
        // V1.9.455: query estendida com campos ICP-Brasil (signed_pdf_url + iti_*).
        // Cast supabase as any porque codegen tipo defasado (V1.9.299 migration não regenerou types.ts).
        const { data, error } = await (supabase as any)
          .from('patient_exam_requests')
          .select('id, content, status, created_at, digital_signature, signed_pdf_url, iti_validation_url, signature_timestamp, professional_id')
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

  // V1.9.455: gera signed URL (TTL 7 dias) e abre PDF binário ICP-Brasil em nova aba.
  // Path `exam_requests/<id>.pdf` → URL temporária assinada pelo Storage (RLS owner-only).
  // Trigger empírico: caso João Guimarães 25/05 (laboratório exigiu PDF/link, não print).
  const handleDownloadSignedPdf = async (req: ExamRequestRow) => {
    if (!req.signed_pdf_url) return
    try {
      const { data, error } = await supabase
        .storage
        .from('signed_documents')
        .createSignedUrl(req.signed_pdf_url, 60 * 60 * 24 * 7) // 7 dias
      if (error) throw error
      if (data?.signedUrl) window.open(data.signedUrl, '_blank')
    } catch (err: any) {
      console.error('[PatientExamRequestsCard] Erro ao gerar signed URL:', err?.message || err)
      alert('Não foi possível gerar o link do PDF assinado. Tente novamente em alguns segundos.')
    }
  }

  // V1.9.455: gera signed URL + manda WhatsApp com LINK (não só texto).
  // Resolve caso Ariane: laboratório precisa abrir PDF, não print. Link signed URL TTL 7d
  // permite atendente abrir direto no navegador dela sem login.
  const handleShareSignedPdfWhatsApp = async (req: ExamRequestRow) => {
    if (!req.signed_pdf_url) return
    try {
      const { data, error } = await supabase
        .storage
        .from('signed_documents')
        .createSignedUrl(req.signed_pdf_url, 60 * 60 * 24 * 7) // 7 dias
      if (error) throw error
      if (data?.signedUrl) {
        const text = `*Solicitação de Exame Assinada Digitalmente - MedCannLab*\n\nDocumento assinado com certificado ICP-Brasil (validade jurídica plena - CFM 2.314/2022 + Lei 14.063/2020).\n\n📥 Baixar PDF assinado: ${data.signedUrl}\n\n🔎 Validar criptograficamente: https://validar.iti.gov.br/\n\n_Link válido por 7 dias._`
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
      }
    } catch (err: any) {
      console.error('[PatientExamRequestsCard] Erro ao compartilhar PDF:', err?.message || err)
      // Fallback: compartilha texto sem PDF
      handleShareWhatsApp(req.content)
    }
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
            <h3 className="text-base font-semibold text-white">Exames Solicitados</h3>
            <p className="text-[11px] text-slate-400">Clique para expandir • Imprima ou compartilhe</p>
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
        <div className="flex items-center gap-3 py-6 justify-center text-slate-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cyan-400" />
          <span className="text-sm">Carregando…</span>
        </div>
      ) : examRequests.length > 0 ? (
        <div className="divide-y divide-slate-700/40">
          {pagedExams.map((req, idx) => {
            const st = STATUS_CONFIG[req.status] || STATUS_CONFIG.draft
            const isExpanded = expandedExamId === req.id
            const preview = req.content.split('\n')[0].substring(0, 80)
            // V1.9.455: flags ICP-Brasil
            const isSigned = !!req.digital_signature
            const hasIcpPdf = !!req.signed_pdf_url
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
                  {/* V1.9.455: badge ICP quando assinado */}
                  {isSigned && (
                    <span className="text-[9px] px-1 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded font-medium whitespace-nowrap" title="Assinado digitalmente com ICP-Brasil">
                      ICP
                    </span>
                  )}
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
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans max-h-64 overflow-y-auto custom-scrollbar">{req.content}</pre>

                    {/* V1.9.455: banner verde — documento assinado ICP + PDF disponível */}
                    {isSigned && hasIcpPdf && (
                      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-[11px] text-emerald-200 leading-relaxed">
                            <strong>Documento assinado digitalmente com ICP-Brasil.</strong>{' '}
                            Validade jurídica plena (CFM 2.314/2022 + Lei 14.063/2020). PDF PBAD AD-RB conforme ITI.
                          </p>
                          {req.signature_timestamp && (
                            <p className="text-[10px] text-emerald-300/70 mt-0.5">
                              Assinado em {new Date(req.signature_timestamp).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* V1.9.455: banner amarelo — assinado mas PDF binário ainda não gerado (legado pré-V1.9.299 ou processando) */}
                    {isSigned && !hasIcpPdf && (
                      <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-200 leading-relaxed">
                          <strong>PDF ICP-Brasil ainda não gerado.</strong>{' '}
                          A assinatura digital existe no sistema, mas o arquivo PBAD ainda não foi processado (documento legado ou em processamento). Para apresentação física use "Imprimir" abaixo; para reprocessar, contacte o suporte.
                        </p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {/* V1.9.455: botão "Baixar PDF assinado" — só renderiza se signed_pdf_url existir */}
                      {hasIcpPdf && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadSignedPdf(req) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-200 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-lg transition-colors"
                          title="Baixar PDF assinado ICP-Brasil (PBAD AD-RB)"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar PDF ICP
                        </button>
                      )}
                      {/* V1.9.455: link "Validar no ITI" — só renderiza se PDF binário existe (validador oficial exige upload) */}
                      {hasIcpPdf && (
                        <a
                          href="https://validar.iti.gov.br/"
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                          title="Validador oficial do ITI — faça upload do PDF baixado"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Validar no ITI
                        </a>
                      )}
                      {/* V1.9.455: "WhatsApp link" — manda PDF binário via link signed URL TTL 7d (resolve caso Ariane laboratório) */}
                      {hasIcpPdf && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShareSignedPdfWhatsApp(req) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#25D366] bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/30 rounded-lg transition-colors"
                          title="Compartilhar PDF assinado via WhatsApp (link válido 7 dias)"
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> WhatsApp + PDF
                        </button>
                      )}
                      {/* Handlers existentes preservados (anti-regressão) */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handlePrintExam(req.content) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-600/50 rounded-lg transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Imprimir
                      </button>
                      {/* Botão WhatsApp texto: só renderiza se NÃO houver PDF binário (senão usa o "WhatsApp + PDF" acima) */}
                      {!hasIcpPdf && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(req.content) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#25D366] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-lg transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                      )}
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
          <p className="text-sm text-slate-400">Nenhuma solicitação de exame encontrada</p>
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
