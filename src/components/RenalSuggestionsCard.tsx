/**
 * RenalSuggestionsCard — V1.9.307 (compact layout V1.9.309)
 *
 * Card pra médico ver sugestões DRC pendentes (extraídas automaticamente
 * de captation_extras laboratorios_inline). Médico aprova/rejeita.
 *
 * V1.9.309: layout compacto side-by-side com paginação lateral (máx 5/página).
 * Reusa <DotPagination /> + padrão grid agendamento parceiros (PatientAppointments.tsx:1784-1803).
 *
 * IMPORTANTE clínico/regulatório:
 * - Linguagem NÃO-categórica obrigatória ("possível estadiamento compatível com")
 * - Aprovação cria renal_exams oficial (ato médico)
 * - Rejeição arquiva sem persistir
 * - Sugestões expiram em 30d automaticamente (pg_cron)
 *
 * Visibilidade RLS (V1.9.307 migration): médico vinculado ao paciente
 * via appointments OU admin. Paciente NÃO vê. (Pedro vê tudo como admin.)
 */

import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle, XCircle, Activity, Info, FileSearch, Archive, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import DotPagination from './ui/DotPagination'

// V1.9.329 — campos adicionais (status/reviewed/reviewer_name/rejection_reason/renal_exam_id)
// vindos de v_renal_suggestions_active (substitui v_renal_suggestions_pending).
// Permite renderizar 3 estados visuais distintos (pending laranja / approved verde / rejected cinza)
// + ação "Arquivar" pra médico tirar do dashboard quando quiser.
interface RenalSuggestion {
  id: string
  patient_id: string
  patient_name: string
  creatinine_mg_dl: number | null
  egfr_calculated: number | null
  drc_stage_suggested: string | null
  proteinuria_acr_mg_g: number | null
  patient_age: number | null
  patient_sex: string | null
  confidence_score: number
  source_text: string
  ckd_epi_version: string
  created_at: string
  expires_at: string
  days_until_expire: string | number
  // V1.9.329 — estado/revisão/arquivo
  status: 'pending' | 'approved' | 'rejected'
  reviewed_at: string | null
  reviewed_by: string | null
  reviewer_name: string | null
  rejection_reason: string | null
  renal_exam_id: string | null
}

const STAGE_DESCRIPTIONS: Record<string, { label: string, color: string, bg: string }> = {
  G1: { label: 'TFG ≥ 90', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  G2: { label: 'TFG 60-89', color: 'text-lime-300', bg: 'bg-lime-500/10 border-lime-500/30' },
  G3a: { label: 'TFG 45-59', color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30' },
  G3b: { label: 'TFG 30-44', color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/30' },
  G4: { label: 'TFG 15-29', color: 'text-red-300', bg: 'bg-red-500/10 border-red-500/30' },
  G5: { label: 'TFG < 15', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' }
}

const PER_PAGE = 5

// [V1.9.477] (28/05 01:00 BRT) — prop compact opcional pra Card renderizar
// em col estreita (grid externo 2xl:grid-cols-4 = ~352-400px/col). Quando
// compact=true: forca grid interno cols-1 (em vez de responsivo md/xl/2xl).
// Default false preserva comportamento atual (callers existentes intactos).
interface RenalSuggestionsCardProps {
  compact?: boolean
}

export default function RenalSuggestionsCard({ compact = false }: RenalSuggestionsCardProps = {}) {
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState<RenalSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectReasonFor, setRejectReasonFor] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(0)
  // V1.9.307-D — modal in-context (não navega pra outra tela)
  const [reviewingSugg, setReviewingSugg] = useState<RenalSuggestion | null>(null)

  const loadSuggestions = async () => {
    setLoading(true)
    // V1.9.329 — view nova: pending + approved/rejected últimos 30d, exclui archived.
    // Frontend renderiza estados visuais distintos por status.
    const { data, error } = await (supabase as any)
      .from('v_renal_suggestions_active')
      .select('*')
    if (!error && data) {
      setSuggestions(data as RenalSuggestion[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadSuggestions()
    const interval = setInterval(loadSuggestions, 60000)
    return () => clearInterval(interval)
  }, [])

  const totalPages = Math.max(1, Math.ceil(suggestions.length / PER_PAGE))
  const paginated = useMemo(() => {
    const start = page * PER_PAGE
    return suggestions.slice(start, start + PER_PAGE)
  }, [suggestions, page])

  useEffect(() => {
    if (page > 0 && page >= totalPages) setPage(Math.max(0, totalPages - 1))
  }, [totalPages, page])

  const handleApprove = async (sugg: RenalSuggestion) => {
    if (!window.confirm(
      `Aprovar sugestão pra ${sugg.patient_name}?\n\n` +
      `Creatinina: ${sugg.creatinine_mg_dl} mg/dL\n` +
      `eGFR: ${sugg.egfr_calculated} mL/min/1.73m²\n` +
      `Estágio: ${sugg.drc_stage_suggested}\n\n` +
      `Isso vai criar um registro oficial em renal_exams.`
    )) return

    setProcessingId(sugg.id)
    const { error } = await (supabase.rpc as any)('approve_renal_suggestion', {
      p_suggestion_id: sugg.id,
      p_creatinine: sugg.creatinine_mg_dl,
      p_egfr: sugg.egfr_calculated,
      p_proteinuria: sugg.proteinuria_acr_mg_g,
      p_drc_stage: sugg.drc_stage_suggested
    })
    setProcessingId(null)

    if (error) {
      alert('Erro ao aprovar: ' + error.message)
    } else {
      await loadSuggestions()
    }
  }

  const handleReject = async (sugg: RenalSuggestion) => {
    setProcessingId(sugg.id)
    const { error } = await (supabase.rpc as any)('reject_renal_suggestion', {
      p_suggestion_id: sugg.id,
      p_reason: rejectReason || null
    })
    setProcessingId(null)
    setRejectReasonFor(null)
    setRejectReason('')

    if (error) {
      alert('Erro ao rejeitar: ' + error.message)
    } else {
      await loadSuggestions()
    }
  }

  // V1.9.329 — arquiva sugestão já revisada (approved/rejected) pra tirar do dashboard
  // sem perder o registro. Card some apenas após ato deliberado do médico.
  const handleArchive = async (sugg: RenalSuggestion) => {
    if (!window.confirm(
      `Arquivar sugestão de ${sugg.patient_name}?\n\n` +
      `O registro continua salvo no banco e em Saúde Renal. Apenas sai do dashboard ativo.`
    )) return

    setProcessingId(sugg.id)
    const { error } = await (supabase.rpc as any)('archive_renal_suggestion', {
      p_suggestion_id: sugg.id
    })
    setProcessingId(null)

    if (error) {
      alert('Erro ao arquivar: ' + error.message)
    } else {
      await loadSuggestions()
    }
  }

  // V1.9.329-B (17/05 23h47) — fix rota 404. Rota real é /app/patients (não
  // /app/clinica/profissional/patients). Query param correto é patientId (não selected).
  // Aba 'charts' (Linha do Tempo V1.9.327) mostra renal_exam aprovado como evento
  // em "Mai/2026" após V1.9.330 estender PatientClinicalTimeline com renal_exams.
  const goToRenalExam = (sugg: RenalSuggestion) => {
    navigate(`/app/patients?patientId=${sugg.patient_id}&tab=charts`)
  }

  if (loading && suggestions.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-sm text-slate-400">Carregando sugestões DRC…</span>
        </div>
      </div>
    )
  }

  // V1.9.624 — empty state em vez de return null (padroniza com Neuro/Relato/Cannabis).
  // Antes: card sumia da tela quando todas sugestoes arquivadas (Maria das Dores 17/05).
  // Pedro flagou assimetria UX: 3 sidecars novos mostram placeholder, Renal sumia.
  // Agora card continua visivel - sinaliza que Sidecar Renal V1.9.307 esta ativo + cron rodando.
  if (suggestions.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-900/20 via-slate-900/60 to-emerald-900/20 p-4 flex flex-col items-center justify-center min-h-[200px] text-center">
        <Activity className="w-8 h-8 text-emerald-300/40 mb-2" />
        <span className="text-base font-semibold text-emerald-200">Sugestões DRC</span>
        <span className="text-xs text-slate-500 mt-1">Nenhuma sugestão pendente</span>
        <span className="text-[10px] text-slate-600 mt-2 italic max-w-[220px] leading-relaxed">
          Sidecar Renal V1.9.307 auto-extrai creatinina, eGFR e A/Cr de menções na fala do paciente
        </span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-orange-950/30 to-red-950/20 border border-orange-500/30 rounded-2xl p-5">
      {/* Header compacto */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-orange-500/20 rounded-lg">
            <Activity className="w-4 h-4 text-orange-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Sugestões DRC Pendentes
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-[10px] rounded-full font-bold">
                {suggestions.length}
              </span>
            </h3>
            <p className="text-[10px] text-orange-300/70">
              Detectadas das falas dos pacientes — requer validação médica
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer regulatório compacto */}
      <div className="mb-3 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-blue-300/90 leading-snug">
          Sugestão automatizada via <strong>CKD-EPI</strong> a partir de valores mencionados pelo paciente
          na AEC. Não constitui diagnóstico — requer validação clínica. Expira em 30d.
        </p>
      </div>

      {/* Grid compacto side-by-side (até 5/página).
          [V1.9.477] compact=true forca cols-1 (renderiza OK em col estreita
          do grid externo 2xl:grid-cols-4 ~352-400px/col). */}
      <div className={compact
        ? "grid grid-cols-1 gap-3"
        : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3"
      }>
        {paginated.map(sugg => {
          const stageInfo = sugg.drc_stage_suggested ? STAGE_DESCRIPTIONS[sugg.drc_stage_suggested] : null
          const isProcessing = processingId === sugg.id
          const isRejecting = rejectReasonFor === sugg.id
          // V1.9.329 — borda/hover por estado (Clinical Cockpit: cor comunica estado clínico)
          const cardBorder =
            sugg.status === 'approved' ? 'border-emerald-500/40 hover:border-emerald-500/60' :
            sugg.status === 'rejected' ? 'border-slate-600/40 hover:border-slate-500/60' :
            'border-slate-700/40 hover:border-orange-500/40'

          return (
            <div
              key={sugg.id}
              className={`bg-slate-900/60 border rounded-xl p-3 flex flex-col gap-2 transition-colors ${cardBorder}`}
            >
              {/* V1.9.329 — badge de status pra approved/rejected (pending sem badge = layout limpo original) */}
              {sugg.status === 'approved' && sugg.reviewed_at && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3 text-emerald-300 flex-shrink-0" />
                  <span className="text-[10px] text-emerald-200 font-semibold truncate">
                    Aprovada{sugg.reviewer_name ? ` por ${sugg.reviewer_name}` : ''} · {new Date(sugg.reviewed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )}
              {sugg.status === 'rejected' && sugg.reviewed_at && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-700/30 border border-slate-600/40">
                  <XCircle className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span className="text-[10px] text-slate-300 font-semibold truncate">
                    Rejeitada{sugg.reviewer_name ? ` por ${sugg.reviewer_name}` : ''} · {new Date(sugg.reviewed_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Paciente + estágio destaque */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white text-xs truncate">{sugg.patient_name}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {sugg.patient_age && sugg.patient_sex
                      ? `${sugg.patient_age}a · ${sugg.patient_sex === 'female' ? 'F' : 'M'}`
                      : '⚠ sem idade/sexo'}
                  </div>
                </div>
                <span className={`text-[10px] font-bold flex-shrink-0 ${
                  sugg.confidence_score >= 0.8 ? 'text-emerald-400' :
                  sugg.confidence_score >= 0.6 ? 'text-amber-400' : 'text-slate-400'
                }`}>
                  {(sugg.confidence_score * 100).toFixed(0)}%
                </span>
              </div>

              {/* Estágio sugerido (linguagem não-categórica) */}
              {stageInfo && sugg.drc_stage_suggested && (
                <div className={`px-2 py-1.5 rounded-lg border ${stageInfo.bg}`}>
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className={`w-3 h-3 flex-shrink-0 ${stageInfo.color}`} />
                    <span className={`text-[11px] font-bold ${stageInfo.color}`}>
                      Possível DRC {sugg.drc_stage_suggested}
                    </span>
                  </div>
                  <p className={`text-[9px] mt-0.5 ml-4.5 ${stageInfo.color} opacity-80`}>
                    {stageInfo.label}
                  </p>
                </div>
              )}

              {/* Labs compactos */}
              <div className="space-y-1 text-[10px]">
                {sugg.creatinine_mg_dl != null && (
                  <div className="flex justify-between bg-slate-800/60 rounded px-2 py-1">
                    <span className="text-slate-500 uppercase">Creat</span>
                    <span className="text-white font-bold">{sugg.creatinine_mg_dl} mg/dL</span>
                  </div>
                )}
                {sugg.egfr_calculated != null && (
                  <div className="flex justify-between bg-slate-800/60 rounded px-2 py-1">
                    <span className="text-slate-500 uppercase">eGFR</span>
                    <span className="text-white font-bold">{sugg.egfr_calculated}</span>
                  </div>
                )}
                {sugg.proteinuria_acr_mg_g != null && (
                  <div className="flex justify-between bg-slate-800/60 rounded px-2 py-1">
                    <span className="text-slate-500 uppercase">A/Cr</span>
                    <span className="text-white font-bold">{sugg.proteinuria_acr_mg_g} mg/g</span>
                  </div>
                )}
              </div>

              {/*
                V1.9.307-B (16/05/2026 noite): Trecho original SEMPRE expandido.
                Antes era <details> collapsible — médico precisava lembrar de
                clicar pra ver O QUE paciente literal disse. Pedro identificou que
                isso induz aprovação impulsiva sem revisão clínica. Aprovar = ato
                clínico oficial (cria registro renal_exams no prontuário) — leitura
                do trecho deve ser default, não opcional.
              */}
              <div className="text-[10px]">
                <div className="flex items-center gap-1 text-slate-500 mb-1">
                  <Info className="w-2.5 h-2.5" />
                  <span className="font-semibold uppercase tracking-wider">Fala do paciente</span>
                </div>
                <p className="text-[10px] text-slate-300 italic bg-slate-800/40 rounded p-1.5 leading-relaxed line-clamp-4">
                  "{sugg.source_text}"
                </p>
              </div>

              {/* V1.9.329 — motivo de rejeição visível se houver */}
              {sugg.status === 'rejected' && sugg.rejection_reason && (
                <div className="text-[10px] text-slate-400 italic bg-slate-800/30 rounded px-2 py-1">
                  Motivo: {sugg.rejection_reason}
                </div>
              )}

              {/* Ações — V1.9.329 condicional por status */}
              {sugg.status === 'pending' && isRejecting ? (
                <div className="space-y-1.5 mt-auto">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Motivo (opcional)"
                    className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-[10px] text-white"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleReject(sugg)}
                      disabled={isProcessing}
                      className="flex-1 px-2 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded text-[10px] font-semibold disabled:opacity-50"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => { setRejectReasonFor(null); setRejectReason('') }}
                      className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-[10px]"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : sugg.status === 'approved' ? (
                // V1.9.329 — estado approved: link Saúde Renal + Arquivar
                <div className="space-y-1 mt-auto">
                  <button
                    onClick={() => goToRenalExam(sugg)}
                    disabled={isProcessing}
                    className="w-full px-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-200 rounded text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50 border border-emerald-500/30"
                    title="Abrir prontuário do paciente (Saúde Renal)"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Ver em Saúde Renal
                  </button>
                  <button
                    onClick={() => handleArchive(sugg)}
                    disabled={isProcessing}
                    className="w-full px-2 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-medium flex items-center justify-center gap-1 disabled:opacity-50 border border-slate-700/50"
                    title="Arquivar — tira do dashboard, mantém registro"
                  >
                    <Archive className="w-3 h-3" />
                    Arquivar
                  </button>
                </div>
              ) : sugg.status === 'rejected' ? (
                // V1.9.329 — estado rejected: só Arquivar (registro já tem motivo)
                <div className="mt-auto">
                  <button
                    onClick={() => handleArchive(sugg)}
                    disabled={isProcessing}
                    className="w-full px-2 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-400 rounded text-[10px] font-medium flex items-center justify-center gap-1 disabled:opacity-50 border border-slate-700/50"
                    title="Arquivar — tira do dashboard, mantém registro"
                  >
                    <Archive className="w-3 h-3" />
                    Arquivar
                  </button>
                </div>
              ) : (
                <div className="space-y-1 mt-auto">
                  {/*
                    V1.9.307-D (16/05/2026 noite): modal in-context na própria tela.
                    Pedro reportou que navegar pra outra rota (V1.9.307-C) era ruim —
                    médico perde contexto. Agora abre modal lateral aqui mesmo com:
                    - Fala original completa (sem line-clamp)
                    - Estágio KDIGO descritivo
                    - Valores labs com unidades
                    - Trigger "Ver relatório completo" pra quem quiser ir mais fundo
                    - Aprovar/Descartar acessíveis dentro do modal
                  */}
                  <button
                    onClick={() => setReviewingSugg(sugg)}
                    disabled={isProcessing}
                    className="w-full px-2 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-medium flex items-center justify-center gap-1 disabled:opacity-50 border border-slate-700/50"
                    title="Revisar detalhes antes de aprovar — abre modal in-context"
                  >
                    <FileSearch className="w-3 h-3" />
                    Revisar detalhes
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleApprove(sugg)}
                      disabled={isProcessing}
                      className="flex-1 px-2 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded text-[10px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50 border border-emerald-500/30"
                      title="Aprovar e criar registro renal_exams oficial"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Aprovar
                    </button>
                    <button
                      onClick={() => setRejectReasonFor(sugg.id)}
                      disabled={isProcessing}
                      className="px-2 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[10px] flex items-center justify-center disabled:opacity-50"
                      title="Descartar sugestão"
                    >
                      <XCircle className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Paginação lateral — DotPagination V1.9.234 (padrão agendamento parceiros) */}
      <DotPagination
        currentPage={page + 1}
        totalPages={totalPages}
        onPageChange={(p) => setPage(p - 1)}
      />

      {/*
        V1.9.307-D — Modal de revisão in-context.
        Médico clica "Revisar detalhes" → modal abre AQUI (não navega).
        Mostra info expandida + trigger pra "Ver relatório completo" se
        quiser ir mais fundo. Aprovar/Descartar acessíveis dentro do modal.
      */}
      {reviewingSugg && (
        <SuggestionReviewModal
          suggestion={reviewingSugg}
          onClose={() => setReviewingSugg(null)}
          onApprove={async () => {
            const s = reviewingSugg
            setReviewingSugg(null)
            await handleApprove(s)
          }}
          onReject={() => {
            setRejectReasonFor(reviewingSugg.id)
            setReviewingSugg(null)
          }}
          onOpenReport={() => {
            // Navega pra rota de relatórios da paciente — médico vê
            // contexto completo (último report + histórico AEC)
            navigate(`/app/clinica/profissional/relatorios?patientId=${reviewingSugg.patient_id}`)
            setReviewingSugg(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// SuggestionReviewModal — modal in-context pra revisão pré-aprovação
// ============================================================================
interface SuggestionReviewModalProps {
  suggestion: RenalSuggestion
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onOpenReport: () => void
}

function SuggestionReviewModal({ suggestion, onClose, onApprove, onReject, onOpenReport }: SuggestionReviewModalProps) {
  const stageInfo = suggestion.drc_stage_suggested ? STAGE_DESCRIPTIONS[suggestion.drc_stage_suggested] : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-orange-500/5 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Activity className="w-5 h-5 text-orange-300 flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                Revisão · Sugestão DRC pendente
              </h3>
              <p className="text-[11px] text-orange-300/80 truncate">
                {suggestion.patient_name}
                {suggestion.patient_age && suggestion.patient_sex && (
                  <span className="text-slate-500 ml-1">
                    · {suggestion.patient_age}a · {suggestion.patient_sex === 'female' ? 'feminino' : 'masculino'}
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Estágio sugerido (destaque visual) */}
          {stageInfo && suggestion.drc_stage_suggested && (
            <div className={`px-4 py-3 rounded-lg border ${stageInfo.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className={`w-5 h-5 ${stageInfo.color}`} />
                <span className={`text-base font-bold ${stageInfo.color}`}>
                  Possível estadiamento compatível com DRC {suggestion.drc_stage_suggested}
                </span>
              </div>
              <p className={`text-xs ml-7 ${stageInfo.color} opacity-90`}>
                {stageInfo.label}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 ml-7 italic">
                Sugestão automatizada via CKD-EPI 2021 — não constitui diagnóstico, requer sua validação clínica.
              </p>
            </div>
          )}

          {/* Confiança da detecção */}
          <div className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Confiança da detecção</span>
            <span className={`text-sm font-bold ${
              suggestion.confidence_score >= 0.8 ? 'text-emerald-400' :
              suggestion.confidence_score >= 0.6 ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {(suggestion.confidence_score * 100).toFixed(0)}%
            </span>
          </div>

          {/* Valores laboratoriais (grandes, com unidades) */}
          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
              Valores mencionados pelo paciente
            </div>
            <div className="grid grid-cols-3 gap-2">
              {suggestion.creatinine_mg_dl != null && (
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Creatinina</div>
                  <div className="text-lg text-white font-bold mt-0.5">{suggestion.creatinine_mg_dl}</div>
                  <div className="text-[10px] text-slate-500">mg/dL</div>
                </div>
              )}
              {suggestion.egfr_calculated != null && (
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase">eGFR</div>
                  <div className="text-lg text-white font-bold mt-0.5">{suggestion.egfr_calculated}</div>
                  <div className="text-[10px] text-slate-500">mL/min/1.73m²</div>
                </div>
              )}
              {suggestion.proteinuria_acr_mg_g != null && (
                <div className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase">A/Cr</div>
                  <div className="text-lg text-white font-bold mt-0.5">{suggestion.proteinuria_acr_mg_g}</div>
                  <div className="text-[10px] text-slate-500">mg/g</div>
                </div>
              )}
            </div>
            <div className="text-[9px] text-slate-500 mt-2 italic">
              CKD-EPI versão {suggestion.ckd_epi_version} · processado em {new Date(suggestion.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* Fala original COMPLETA (sem line-clamp) */}
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
              <Info className="w-3 h-3" />
              Fala original do paciente (sem corte)
            </div>
            <div className="bg-slate-800/40 border-l-2 border-orange-500/40 rounded p-3">
              <p className="text-xs text-slate-200 italic leading-relaxed whitespace-pre-wrap">
                "{suggestion.source_text}"
              </p>
            </div>
          </div>

          {/* Alerta idade/sexo se ausente (eGFR pode estar incompleto) */}
          {(!suggestion.patient_age || !suggestion.patient_sex) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <p className="text-[11px] text-amber-300">
                ⚠ Idade/sexo não estão cadastrados pra esta paciente — o eGFR pode estar incompleto (CKD-EPI requer ambos).
              </p>
            </div>
          )}

          {/* Trigger: ver relatório completo */}
          <button
            onClick={onOpenReport}
            className="w-full px-3 py-2.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border border-slate-700/50 transition-colors"
          >
            <FileSearch className="w-3.5 h-3.5" />
            Ver relatório completo da paciente
            <span className="text-[10px] text-slate-500">(abre página de relatórios)</span>
          </button>
        </div>

        {/* Footer — Aprovar / Descartar / Cancelar */}
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            Voltar
          </button>
          <div className="flex-1" />
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-medium"
          >
            <XCircle className="w-3.5 h-3.5" />
            Descartar
          </button>
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/40 hover:bg-emerald-600/60 text-emerald-100 rounded-lg text-xs font-bold border border-emerald-500/40 shadow-lg"
            title="Cria registro oficial em renal_exams (prontuário)"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Aprovar e criar registro
          </button>
        </div>
      </div>
    </div>
  )
}
