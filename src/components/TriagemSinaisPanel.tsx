/**
 * TriagemSinaisPanel — V1.9.614 (cockpit de triagem)
 *
 * Feed UNIFICADO + PRIORIZADO dos 4 sidecars cognitivos. Lê v_clinical_signals
 * (UNION RLS-safe das 4 tabelas), ranqueia (pendentes > confiança > recência),
 * filtra por tipo, e cada linha → prontuário canônico. É a porta SINAL-PRIMEIRO:
 * "doutor, hoje esses N sinais nos seus pacientes pedem atenção, em ordem".
 *
 * Escala por agregação (não por multiplicar cards): domínio novo entra na view e
 * aparece aqui sem novo componente. Os 4 cards continuam abaixo como detalhe.
 * Z2: sinaliza, não decide. RLS: cada médico só os seus pacientes (security_invoker).
 */
import { ListFilter, ArrowRight, Inbox } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface SignalRow {
  id: string
  patient_id: string
  tipo: string
  dominio: string
  subcategoria: string
  fala_literal: string
  confianca: number
  status: string
  created_at: string
  patientName: string
}

const TIPOS = ['TODOS', 'RENAL', 'NEURO', 'RELATO', 'CANNABIS'] as const

function tipoStyle(t: string): string {
  switch (t) {
    case 'RENAL': return 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30'
    case 'NEURO': return 'bg-purple-500/20 text-purple-200 border-purple-500/30'
    case 'RELATO': return 'bg-teal-500/20 text-teal-200 border-teal-500/30'
    case 'CANNABIS': return 'bg-lime-500/20 text-lime-200 border-lime-500/30'
    default: return 'bg-slate-500/20 text-slate-200 border-slate-500/30'
  }
}

function confColor(c: number): string {
  if (c >= 80) return 'text-emerald-300'
  if (c >= 60) return 'text-amber-300'
  return 'text-orange-300'
}

export default function TriagemSinaisPanel() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<SignalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [visible, setVisible] = useState(false)
  const [tipoFiltro, setTipoFiltro] = useState<string>('TODOS')
  const [soPendentes, setSoPendentes] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) { setLoading(false); return }
        const { data: profile } = await supabase.from('users').select('type').eq('id', user.id).single()
        const t = profile?.type
        if (!(t === 'professional' || t === 'profissional' || t === 'admin')) { setLoading(false); return }
        setVisible(true)

        const { data: sigs } = await (supabase as any)
          .from('v_clinical_signals')
          .select('id, patient_id, tipo, dominio, subcategoria, fala_literal, confianca, status, created_at')
        if (!sigs?.length) { setLoading(false); return }

        const ids = [...new Set((sigs as any[]).map((s) => s.patient_id))]
        const { data: users } = await supabase.from('users').select('id, name').in('id', ids)
        const nameMap = new Map((users || []).map((u: any) => [u.id, u.name]))

        setRows((sigs as any[]).map((s) => ({ ...s, patientName: nameMap.get(s.patient_id) || 'Paciente' })))
      } catch {
        // silencia — não-crítico
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Ranking: pendentes primeiro > confiança desc > recência desc
  const ranked = useMemo(() => {
    return rows
      .filter((r) => (tipoFiltro === 'TODOS' || r.tipo === tipoFiltro) && (!soPendentes || r.status === 'pending'))
      .sort((a, b) => {
        const ap = a.status === 'pending' ? 0 : 1
        const bp = b.status === 'pending' ? 0 : 1
        if (ap !== bp) return ap - bp
        if (b.confianca !== a.confianca) return b.confianca - a.confianca
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [rows, tipoFiltro, soPendentes])

  if (loading || !visible) return null

  const totalPendentes = rows.filter((r) => r.status === 'pending').length
  const TOP = 14
  const shown = ranked.slice(0, TOP)

  return (
    <div className="mb-3 rounded-xl border border-slate-700/40 bg-gradient-to-br from-slate-900/60 to-slate-900/30 overflow-hidden">
      {/* Header — V1.9.618 fontes maiores p/ acessibilidade (Ricardo) */}
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-slate-700/40 bg-white/[0.02]">
        <div className="flex items-center gap-2 min-w-0">
          <Inbox className="w-5 h-5 text-slate-300 flex-shrink-0" />
          <h4 className="text-base font-semibold text-slate-100">Triagem de Sinais</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex-shrink-0">
            {totalPendentes} pendente{totalPendentes !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSoPendentes((v) => !v)}
          className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
          title="Alternar entre só pendentes e todos"
        >
          <ListFilter className="w-4 h-4" /> {soPendentes ? 'só pendentes' : 'todos'}
        </button>
      </div>

      {/* Filtro por tipo — V1.9.618 chips maiores e mais clicáveis */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-700/30 overflow-x-auto">
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipoFiltro(t)}
            className={`text-xs font-medium px-3 py-1 rounded-full border whitespace-nowrap transition-colors ${
              tipoFiltro === t
                ? (t === 'TODOS' ? 'bg-slate-200/20 text-white border-slate-300/40' : tipoStyle(t))
                : 'bg-transparent text-slate-500 border-slate-700/40 hover:text-slate-300'
            }`}
          >
            {t === 'TODOS' ? 'Todos' : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Lista ranqueada — V1.9.618 linhas mais altas + fontes maiores (Ricardo enxerga) */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-800/60">
        {shown.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-slate-500">Nenhum sinal nesse filtro.</div>
        ) : (
          shown.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => navigate(`/app/patients?patientId=${r.patient_id}&tab=charts`)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors group"
              title={`Abrir prontuário de ${r.patientName}`}
            >
              <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold border ${tipoStyle(r.tipo)}`}>
                {r.tipo}
              </span>
              <span className={`flex-shrink-0 text-sm font-bold w-7 text-right ${confColor(r.confianca)}`}>
                {r.confianca}
              </span>
              <span className="text-sm text-slate-100 font-medium truncate max-w-[180px] flex-shrink-0">
                {r.patientName}
              </span>
              <span className="text-xs text-slate-400 italic truncate flex-1 min-w-0">
                {r.subcategoria} · "{r.fala_literal}"
              </span>
              {r.status !== 'pending' && (
                <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded font-semibold ${r.status === 'approved' ? 'text-emerald-300 bg-emerald-500/10' : 'text-slate-400 bg-slate-700/40'}`}>
                  {r.status === 'approved' ? '✓' : r.status === 'rejected' ? '✕' : r.status}
                </span>
              )}
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 flex-shrink-0 transition-colors" />
            </button>
          ))
        )}
      </div>

      {ranked.length > TOP && (
        <div className="px-3 py-2 text-center text-xs text-slate-500 border-t border-slate-800/60">
          +{ranked.length - TOP} sinais (refine o filtro pra ver)
        </div>
      )}
    </div>
  )
}
