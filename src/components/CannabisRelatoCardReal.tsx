/**
 * CannabisRelatoCardReal — V1.9.613 "Cannabis no Relato"
 *
 * Captura a RELAÇÃO do paciente com a cannabis na FALA dele: VONTADE (intenção/
 * curiosidade/substituir), USO (atual/prévio), RECEIO (medo/barreira). Lê
 * `clinical_cannabis_signals` (Edge cannabis-relato-extractor, do report). Paginação
 * < > + aprovar/rejeitar. É a autonomia do paciente trazida ao médico.
 *
 * FILOSOFIA (Pedro 07/06): NÃO é indicação/sugestão do app — é o que o PACIENTE
 * EXPRESSOU espontaneamente. MIMRE. Z2: sinaliza a fala, não prescreve.
 * Fase 2: cruzar com prescrições (quem aderiu após o relato = eficácia).
 *
 * RLS: médico vê sinais dos seus pacientes (via appointments) OU admin.
 */
import { Leaf, CheckCircle, XCircle, FlaskConical, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface CannabisSignal {
  id: string
  patient_id: string
  report_id: string
  dominio: 'VONTADE' | 'USO' | 'RECEIO'
  subcategoria: string
  fala_literal: string
  confianca: number
  status: string
  created_at: string
}

interface CannabisCase {
  reportId: string
  patientId: string
  patientName: string
  date: string
  signals: CannabisSignal[]
}

function confidenceColor(conf: number): string {
  if (conf >= 80) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
  if (conf >= 60) return 'text-amber-300 bg-amber-500/10 border-amber-500/30'
  return 'text-orange-300 bg-orange-500/10 border-orange-500/30'
}

function dominioBadge(d: string): string {
  if (d === 'VONTADE') return 'bg-lime-500/20 text-lime-200 border-lime-500/30'
  if (d === 'USO') return 'bg-sky-500/20 text-sky-200 border-sky-500/30'
  return 'bg-orange-500/20 text-orange-200 border-orange-500/30' // RECEIO
}

export default function CannabisRelatoCardReal() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<CannabisCase[]>([])
  const [page, setPage] = useState(1)
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

        const { data: sigs } = await (supabase as any)
          .from('clinical_cannabis_signals')
          .select('id, patient_id, report_id, dominio, subcategoria, fala_literal, confianca, status, created_at')
          .order('created_at', { ascending: false })

        if (!sigs?.length) { setLoading(false); return }

        const signals = sigs as CannabisSignal[]
        const ids = [...new Set(signals.map((s) => s.patient_id))]
        const { data: users } = await supabase.from('users').select('id, name').in('id', ids)
        const nameMap = new Map((users || []).map((u: any) => [u.id, u.name]))

        const byReport = new Map<string, CannabisCase>()
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
        // silencia
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateStatus = async (signalId: string, status: 'approved' | 'rejected') => {
    setCases((prev) => prev.map((c) => ({
      ...c,
      signals: c.signals.map((s) => (s.id === signalId ? { ...s, status } : s)),
    })))
    await (supabase as any)
      .from('clinical_cannabis_signals')
      .update({ status, reviewed_by: userId, reviewed_at: new Date().toISOString() })
      .eq('id', signalId)
  }

  if (loading || !visible) return null

  // V1.9.620 — fontes acessiveis (Ricardo mal enxergava no laptop)
  if (cases.length === 0) {
    return (
      <div className="rounded-xl border border-lime-500/30 bg-gradient-to-br from-lime-900/20 via-slate-900/60 to-green-900/20 p-4 flex flex-col items-center justify-center min-h-[200px] text-center">
        <Leaf className="w-8 h-8 text-lime-300/40 mb-2" />
        <span className="text-base font-semibold text-lime-200">Cannabis no Relato</span>
        <span className="text-xs text-slate-500 mt-1">Nenhum relato sobre cannabis ainda</span>
      </div>
    )
  }

  const totalPages = cases.length
  const current = cases[Math.min(page, totalPages) - 1]
  const dateStr = new Date(current.date).toLocaleDateString('pt-BR')

  return (
    <div className="rounded-xl border border-lime-500/30 bg-gradient-to-br from-lime-900/20 via-slate-900/60 to-green-900/20 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* V1.9.620 fontes acessiveis */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-lime-500/20 bg-lime-500/5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-lime-500/20 border border-lime-500/30 flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-lime-300" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-lime-100 flex items-center gap-1.5 truncate">
              Cannabis no Relato
              <span className="text-xs px-2 py-0.5 rounded-full bg-lime-500/20 text-lime-200 font-normal flex-shrink-0">
                VONTADE · USO · RECEIO
              </span>
            </h3>
            <p className="text-xs text-lime-300/70 mt-0.5">
              Vontade/uso na fala do paciente · {totalPages} caso{totalPages > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
          ● real
        </span>
      </div>

      <div className="px-3 py-3 space-y-3 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-lime-500/10">
          <button
            type="button"
            onClick={() => navigate(`/app/patients?patientId=${current.patientId}&tab=charts`)}
            className="font-medium text-sm text-lime-200/90 truncate hover:text-lime-100 hover:underline text-left"
            title={`Abrir prontuário de ${current.patientName}`}
          >
            {current.patientName}
          </button>
          <span className="flex-shrink-0">{dateStr} · {current.signals.length} sinais</span>
        </div>

        <div className="space-y-2 flex-1">
          {current.signals.map((s) => (
            <div key={s.id} className="flex items-start gap-2 text-xs leading-relaxed">
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-bold border ${confidenceColor(s.confianca)}`}>
                {s.confianca}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${dominioBadge(s.dominio)}`}>
                    {s.dominio}
                  </span>
                  <span className="text-xs text-lime-200/90 font-medium truncate">{s.subcategoria}</span>
                </div>
                <div className="text-xs text-slate-400 italic truncate" title={s.fala_literal}>"{s.fala_literal}"</div>
              </div>
              {s.status === 'pending' ? (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button type="button" onClick={() => updateStatus(s.id, 'approved')} title="Aprovar sinal"
                    className="p-1 rounded text-emerald-300/70 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => updateStatus(s.id, 'rejected')} title="Rejeitar sinal"
                    className="p-1 rounded text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold ${s.status === 'approved' ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10'}`}>
                  {s.status === 'approved' ? '✓' : '✕'}
                </span>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate(`/app/patients?patientId=${current.patientId}&tab=charts`)}
          className="w-full px-3 py-2 bg-lime-500/15 hover:bg-lime-500/30 border border-lime-500/30 text-lime-200 rounded-md text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
          title="Abrir prontuário do paciente"
        >
          <ExternalLink className="w-4 h-4" /> Ver no prontuário
        </button>

        <div className="mt-auto pt-2 border-t border-lime-500/10">
          <p className="text-xs text-slate-500 italic text-center flex items-center justify-center gap-1.5">
            <FlaskConical className="w-3 h-3" /> Z2 — fala do paciente, não é indicação. Médico decide.
          </p>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-lime-500/10">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-lime-500/15 hover:bg-lime-500/30 border border-lime-500/30 text-lime-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Caso anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-lime-200/80 font-medium min-w-[72px] text-center">
                caso {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-lime-500/15 hover:bg-lime-500/30 border border-lime-500/30 text-lime-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Próximo caso"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
