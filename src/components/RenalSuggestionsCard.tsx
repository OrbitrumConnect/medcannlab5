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
import { AlertTriangle, CheckCircle, XCircle, Activity, Info, FileSearch } from 'lucide-react'
import { supabase } from '../lib/supabase'
import DotPagination from './ui/DotPagination'

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

export default function RenalSuggestionsCard() {
  const navigate = useNavigate()
  const [suggestions, setSuggestions] = useState<RenalSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectReasonFor, setRejectReasonFor] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(0)

  const loadSuggestions = async () => {
    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('v_renal_suggestions_pending')
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

  if (suggestions.length === 0) return null

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

      {/* Grid compacto side-by-side (até 5/página) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
        {paginated.map(sugg => {
          const stageInfo = sugg.drc_stage_suggested ? STAGE_DESCRIPTIONS[sugg.drc_stage_suggested] : null
          const isProcessing = processingId === sugg.id
          const isRejecting = rejectReasonFor === sugg.id

          return (
            <div
              key={sugg.id}
              className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 flex flex-col gap-2 hover:border-orange-500/40 transition-colors"
            >
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

              {/* Ações */}
              {isRejecting ? (
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
              ) : (
                <div className="space-y-1 mt-auto">
                  {/*
                    V1.9.307-C (16/05/2026 noite): fix Pedro reportou abertura
                    em nova aba indo pra Agendamentos (section=atendimento estava
                    errado — atendimento é ProfessionalSchedulingWidget, não AEC).
                    Correção:
                    - Rota correta: /app/clinica/profissional/dashboard (sem section)
                      → componente ProfessionalMyDashboard que tem Analisar Paciente
                    - Query param ?analyze=<patient_id> dispara auto-seleção +
                      auto-execução do painel analítico (useEffect V1.9.307-C)
                    - navigate MESMA aba (não nova aba) — UX melhor pro médico,
                      browser back funciona, evita perder contexto da janela
                  */}
                  <button
                    onClick={() => {
                      navigate(`/app/clinica/profissional/dashboard?analyze=${sugg.patient_id}`)
                    }}
                    disabled={isProcessing}
                    className="w-full px-2 py-1.5 bg-slate-800/60 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-medium flex items-center justify-center gap-1 disabled:opacity-50 border border-slate-700/50"
                    title="Abre painel Analisar Paciente com a AEC completa pra revisar contexto antes de aprovar"
                  >
                    <FileSearch className="w-3 h-3" />
                    Revisar AEC completa
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
    </div>
  )
}
