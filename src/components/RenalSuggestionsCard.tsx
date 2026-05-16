/**
 * RenalSuggestionsCard — V1.9.307
 *
 * Card pra médico ver sugestões DRC pendentes (extraídas automaticamente
 * de captation_extras laboratorios_inline). Médico aprova/rejeita.
 *
 * IMPORTANTE clínico/regulatório:
 * - Linguagem NÃO-categórica obrigatória ("possível estadiamento compatível com")
 * - Aprovação cria renal_exams oficial (ato médico)
 * - Rejeição arquiva sem persistir
 * - Sugestões expiram em 30d automaticamente (pg_cron)
 *
 * Memória: project_v1_9_307_renal_inline_suggestions (a criar).
 */

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Activity, Calendar, Info } from 'lucide-react'
import { supabase } from '../lib/supabase'

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
  G1: { label: 'Normal/Elevado (TFG ≥ 90)', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  G2: { label: 'Levemente diminuído (TFG 60-89)', color: 'text-lime-300', bg: 'bg-lime-500/10 border-lime-500/30' },
  G3a: { label: 'Leve a moderado (TFG 45-59)', color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30' },
  G3b: { label: 'Moderado a grave (TFG 30-44)', color: 'text-orange-300', bg: 'bg-orange-500/10 border-orange-500/30' },
  G4: { label: 'Gravemente diminuído (TFG 15-29)', color: 'text-red-300', bg: 'bg-red-500/10 border-red-500/30' },
  G5: { label: 'Falência renal (TFG < 15)', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' }
}

export default function RenalSuggestionsCard() {
  const [suggestions, setSuggestions] = useState<RenalSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectReasonFor, setRejectReasonFor] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const loadSuggestions = async () => {
    setLoading(true)
    // V1.9.307: view nova não está em supabase types.ts gerado automático.
    // Cast as any segue padrão usado em V1.9.300 admin_get_users_activity_summary etc.
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
    // Auto-refresh a cada 60s
    const interval = setInterval(loadSuggestions, 60000)
    return () => clearInterval(interval)
  }, [])

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
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h3 className="text-base font-semibold text-white">Sugestões DRC Pendentes</h3>
        </div>
        <p className="text-xs text-slate-500">Carregando…</p>
      </div>
    )
  }

  if (suggestions.length === 0) return null  // Não polui UI se nada pendente

  return (
    <div className="bg-gradient-to-br from-orange-950/30 to-red-950/20 border border-orange-500/30 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <Activity className="w-5 h-5 text-orange-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              Sugestões DRC Pendentes
              <span className="ml-2 px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full font-bold">
                {suggestions.length}
              </span>
            </h3>
            <p className="text-[11px] text-orange-300/70">
              Detectadas automaticamente a partir das falas dos pacientes — requer validação médica
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer regulatório (GPT review #3) */}
      <div className="mb-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-blue-300/90 leading-relaxed">
          Sugestão automatizada baseada em valores laboratoriais mencionados pelo paciente durante a
          AEC, calculada via fórmula <strong>CKD-EPI</strong>. Não constitui diagnóstico — requer sua
          validação clínica. Sugestões expiram em 30 dias se não revisadas.
        </p>
      </div>

      {/* Lista de sugestões */}
      <div className="space-y-3">
        {suggestions.map(sugg => {
          const stageInfo = sugg.drc_stage_suggested ? STAGE_DESCRIPTIONS[sugg.drc_stage_suggested] : null
          const isProcessing = processingId === sugg.id
          const daysLeft = typeof sugg.days_until_expire === 'string'
            ? parseFloat(sugg.days_until_expire)
            : sugg.days_until_expire

          return (
            <div key={sugg.id} className="bg-slate-900/60 border border-slate-700/40 rounded-xl p-4">
              {/* Linha 1: paciente + confiança */}
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white text-sm truncate">{sugg.patient_name}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {sugg.patient_age && sugg.patient_sex
                      ? `${sugg.patient_age} anos · ${sugg.patient_sex === 'female' ? 'feminino' : 'masculino'}`
                      : '⚠ Idade/sexo não cadastrados — eGFR pode estar incompleto'}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500">Confiança</span>
                  <span className={`text-xs font-bold ${
                    sugg.confidence_score >= 0.8 ? 'text-emerald-400' :
                    sugg.confidence_score >= 0.6 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {(sugg.confidence_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Estágio sugerido (destaque) */}
              {stageInfo && sugg.drc_stage_suggested && (
                <div className={`mb-3 px-3 py-2 rounded-lg border ${stageInfo.bg}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`w-4 h-4 ${stageInfo.color}`} />
                    <span className={`text-sm font-bold ${stageInfo.color}`}>
                      Possível estadiamento compatível com DRC {sugg.drc_stage_suggested}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ml-6 ${stageInfo.color} opacity-80`}>
                    {stageInfo.label}
                  </p>
                </div>
              )}

              {/* Valores laboratoriais */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                {sugg.creatinine_mg_dl != null && (
                  <div className="bg-slate-800/60 rounded px-3 py-1.5">
                    <div className="text-[10px] text-slate-500 uppercase">Creatinina</div>
                    <div className="text-sm text-white font-bold">{sugg.creatinine_mg_dl} mg/dL</div>
                  </div>
                )}
                {sugg.egfr_calculated != null && (
                  <div className="bg-slate-800/60 rounded px-3 py-1.5">
                    <div className="text-[10px] text-slate-500 uppercase">eGFR ({sugg.ckd_epi_version})</div>
                    <div className="text-sm text-white font-bold">{sugg.egfr_calculated} mL/min/1.73m²</div>
                  </div>
                )}
                {sugg.proteinuria_acr_mg_g != null && (
                  <div className="bg-slate-800/60 rounded px-3 py-1.5">
                    <div className="text-[10px] text-slate-500 uppercase">A/Cr</div>
                    <div className="text-sm text-white font-bold">{sugg.proteinuria_acr_mg_g} mg/g</div>
                  </div>
                )}
              </div>

              {/* Fonte (proveniência — GPT review #5) */}
              <details className="mb-3">
                <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-300">
                  Ver trecho original do paciente
                </summary>
                <p className="mt-2 text-[12px] text-slate-300 italic bg-slate-800/40 rounded p-2 leading-relaxed">
                  "{sugg.source_text}"
                </p>
              </details>

              {/* Expiração */}
              <div className="flex items-center gap-1 mb-3 text-[10px] text-slate-500">
                <Calendar className="w-3 h-3" />
                Expira em {Math.floor(daysLeft)} dias se não revisada
              </div>

              {/* Ações */}
              {rejectReasonFor === sugg.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Motivo (opcional)…"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(sugg)}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded text-sm font-semibold disabled:opacity-50"
                    >
                      Confirmar rejeição
                    </button>
                    <button
                      onClick={() => { setRejectReasonFor(null); setRejectReason('') }}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(sugg)}
                    disabled={isProcessing}
                    className="flex-1 px-3 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 rounded text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 border border-emerald-500/30"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar e criar exame
                  </button>
                  <button
                    onClick={() => setRejectReasonFor(sugg.id)}
                    disabled={isProcessing}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Descartar
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
