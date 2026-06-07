/**
 * NeuroSuggestionsCardReal — V1.9.611 (Fase D, gated ?neuro_real=1)
 *
 * Card REAL do Sidecar Neuro: lê `clinical_neuro_signals` de verdade (auto-extraído
 * pela Edge neuro-signal-extractor a partir do RELATÓRIO consolidado), com paginação
 * entre casos (< >) + aprovar/rejeitar por sinal (UPDATE real via RLS).
 *
 * Substitui o NeuroSuggestionsCardPlaceholder (hardcoded) — mas SÓ com ?neuro_real=1
 * (preview pro Eduardo VER antes de virar default). Zero-regressão: o placeholder
 * continua intocado no caminho default.
 *
 * RLS: médico vê sinais de paciente com quem tem appointment OU admin (V1.9.611).
 * Z2: sinaliza, não diagnostica — Eduardo decide.
 */
import { Brain, CheckCircle, XCircle, FlaskConical, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface NeuroSignal {
  id: string
  patient_id: string
  report_id: string
  transtorno: 'TEA' | 'TOD' | 'TDAH' | 'EPILEPSIA'
  subcategoria: string
  fala_literal: string
  confianca: number
  status: string
  created_at: string
}

interface NeuroCase {
  reportId: string
  patientId: string
  patientName: string
  date: string
  signals: NeuroSignal[]
}

function confidenceColor(conf: number): string {
  if (conf >= 80) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
  if (conf >= 60) return 'text-amber-300 bg-amber-500/10 border-amber-500/30'
  return 'text-orange-300 bg-orange-500/10 border-orange-500/30'
}

function transtornoBadge(t: string): string {
  if (t === 'TEA') return 'bg-blue-500/20 text-blue-200 border-blue-500/30'
  if (t === 'TOD') return 'bg-purple-500/20 text-purple-200 border-purple-500/30'
  if (t === 'EPILEPSIA') return 'bg-rose-500/20 text-rose-200 border-rose-500/30'
  return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' // TDAH
}

export default function NeuroSuggestionsCardReal() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<NeuroCase[]>([])
  const [page, setPage] = useState(1) // 1-indexed
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) { setLoading(false); return }
        setUserId(user.id)

        const { data: profile } = await supabase.from('users').select('type').eq('id', user.id).single()
        const t = profile?.type
        const isPro = t === 'professional' || t === 'profissional' || t === 'admin'
        if (!isPro) { setLoading(false); return }
        setVisible(true)

        // RLS filtra: médico só vê sinais dos seus pacientes (via appointments) OU admin
        const { data: sigs } = await (supabase as any)
          .from('clinical_neuro_signals')
          .select('id, patient_id, report_id, transtorno, subcategoria, fala_literal, confianca, status, created_at')
          .order('created_at', { ascending: false })

        if (!sigs?.length) { setLoading(false); return }

        // Nomes dos pacientes
        const signals = sigs as NeuroSignal[]
        const ids = [...new Set(signals.map((s) => s.patient_id))]
        const { data: users } = await supabase.from('users').select('id, name').in('id', ids)
        const nameMap = new Map((users || []).map((u: any) => [u.id, u.name]))

        // Agrupa por report (cada report = 1 caso/página)
        const byReport = new Map<string, NeuroCase>()
        for (const s of signals) {
          if (!byReport.has(s.report_id)) {
            byReport.set(s.report_id, {
              reportId: s.report_id,
              patientId: s.patient_id,
              patientName: nameMap.get(s.patient_id) || 'Paciente',
              date: s.created_at,
              signals: [],
            })
          }
          byReport.get(s.report_id)!.signals.push(s)
        }
        setCases(Array.from(byReport.values()))
      } catch {
        // silencia — preview não-crítico
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateStatus = async (signalId: string, status: 'approved' | 'rejected') => {
    // otimista
    setCases((prev) => prev.map((c) => ({
      ...c,
      signals: c.signals.map((s) => (s.id === signalId ? { ...s, status } : s)),
    })))
    await (supabase as any)
      .from('clinical_neuro_signals')
      .update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq('id', signalId)
  }

  if (loading || !visible) return null

  // Sem casos ainda (RLS pode ter filtrado tudo pro médico) — embrião discreto
  if (cases.length === 0) {
    return (
      <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-slate-900/60 to-indigo-900/20 p-4 flex flex-col items-center justify-center min-h-[200px] text-center">
        <Brain className="w-6 h-6 text-purple-300/40 mb-2" />
        <span className="text-[11px] font-semibold text-purple-200">Sugestões Neuro</span>
        <span className="text-[10px] text-slate-500 mt-1">Nenhum sinal nos seus pacientes ainda</span>
      </div>
    )
  }

  const totalPages = cases.length
  const current = cases[Math.min(page, totalPages) - 1]
  const dateStr = new Date(current.date).toLocaleDateString('pt-BR')

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-slate-900/60 to-indigo-900/20 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
            <Brain className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-purple-100 flex items-center gap-1.5 truncate">
              Sugestões Neuro
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-normal flex-shrink-0">
                TEA · TDAH · TOD
              </span>
            </h3>
            <p className="text-[10px] text-purple-300/70 mt-0.5">
              Auto-extraído do relatório · {totalPages} caso{totalPages > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
          ● real
        </span>
      </div>

      {/* Body — caso atual */}
      <div className="px-3 py-3 space-y-2.5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1.5 border-b border-purple-500/10">
          <button
            type="button"
            onClick={() => navigate(`/app/patients?patientId=${current.patientId}&tab=charts`)}
            className="font-medium text-purple-200/90 truncate hover:text-purple-100 hover:underline text-left"
            title={`Abrir prontuário de ${current.patientName}`}
          >
            {current.patientName}
          </button>
          <span className="flex-shrink-0">{dateStr} · {current.signals.length} sinais</span>
        </div>

        <div className="space-y-1.5 flex-1">
          {current.signals.map((s) => (
            <div key={s.id} className="flex items-start gap-1.5 text-[10px] leading-tight">
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${confidenceColor(s.confianca)}`}>
                {s.confianca}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className={`px-1 py-0.5 rounded text-[8px] font-semibold border ${transtornoBadge(s.transtorno)}`}>
                    {s.transtorno}
                  </span>
                  <span className="text-purple-200/90 font-medium truncate">{s.subcategoria}</span>
                </div>
                <div className="text-slate-400 italic truncate" title={s.fala_literal}>"{s.fala_literal}"</div>
              </div>
              {/* Aprovar / Rejeitar por sinal (UPDATE real) */}
              {s.status === 'pending' ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => updateStatus(s.id, 'approved')} title="Aprovar sinal"
                    className="p-0.5 rounded text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors">
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => updateStatus(s.id, 'rejected')} title="Rejeitar sinal"
                    className="p-0.5 rounded text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition-colors">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className={`flex-shrink-0 text-[8px] px-1 py-0.5 rounded ${s.status === 'approved' ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'}`}>
                  {s.status === 'approved' ? '✓' : '✕'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Trigger: abrir prontuário do paciente (igual "Ver em Saúde Renal" do renal) */}
        <button
          type="button"
          onClick={() => navigate(`/app/patients?patientId=${current.patientId}&tab=charts`)}
          className="w-full px-2 py-1.5 bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 rounded-md text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
          title="Abrir prontuário do paciente"
        >
          <ExternalLink className="w-3 h-3" /> Ver no prontuário
        </button>

        {/* Rodapé fixo no fim do card: disclaimer + paginação < > entre casos */}
        <div className="mt-auto pt-1.5 border-t border-purple-500/10">
          <p className="text-[9px] text-slate-500 italic text-center flex items-center justify-center gap-1">
            <FlaskConical className="w-2.5 h-2.5" /> Z2 — sinaliza, não diagnostica. CFM Eduardo decide.
          </p>
          {/* Paginação entre casos (passos ↔ Gisele) — < > no fim do card */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-purple-500/10">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Caso anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-purple-200/80 font-medium min-w-[64px] text-center">
                caso {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Próximo caso"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
