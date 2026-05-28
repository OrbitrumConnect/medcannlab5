/**
 * NeuroSuggestionsCardPlaceholder — V1.9.475 (27/05/2026)
 * V1.9.475-A (27/05 23h) — layout compacto side-by-side com RenalSuggestionsCard
 *
 * Card EMBRIÃO VISUAL pra sidecar neuro (TEA/TOD/TDAH). NÃO faz fetch DB.
 *
 * Status: Fase A (mapa) ✅ + Smoke manual ✅ + Fase B (calibração) 🟡 pendente
 *
 * Substituído por `<NeuroSuggestionsCard />` REAL quando Fase D codada:
 * - Edge `neuro-signal-extractor` (pattern V1.9.307 sidecar renal)
 * - Tabela `clinical_neuro_signals` (Opção B persistência)
 * - Componente fetch via supabase com paginação + aprovar/rejeitar
 *
 * Visibilidade (V1.9.475):
 * - Eduardo Faveret (sócio neuro) — `eduardoscfaveret@gmail.com`
 * - Admin (Pedro) — vê tudo
 * - Ricardo (nefrologia) — NÃO vê (Renal card é dele)
 * - Outros profissionais — NÃO vê
 *
 * Memórias relacionadas:
 * - project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05
 * - project_smoke_neuro_signal_report_2bdb57fb_27_05
 */

import { Brain, Sparkles, Hourglass, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface UserContext {
  email: string
  type: string
}

export default function NeuroSuggestionsCardPlaceholder() {
  const [userCtx, setUserCtx] = useState<UserContext | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.id) {
          setLoading(false)
          return
        }

        const { data: profile } = await supabase
          .from('users')
          .select('email, type')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserCtx(profile as UserContext)
        }
      } catch {
        // silencia — placeholder não-crítico
      } finally {
        setLoading(false)
      }
    }
    loadContext()
  }, [])

  if (loading || !userCtx) return null

  // [V1.9.475] Visibilidade: Eduardo (neuro) + admin (Pedro). Ricardo NÃO vê.
  const isEduardo = userCtx.email === 'eduardoscfaveret@gmail.com'
  const isAdmin = userCtx.type === 'admin'

  if (!isEduardo && !isAdmin) return null

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-slate-900/60 to-indigo-900/20 backdrop-blur-sm overflow-hidden flex flex-col">
      {/* Header compacto */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2">
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
              Sidecar cognitivo — Fase A ✓ · B 🟡
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-purple-300/60 flex-shrink-0">
          <Hourglass className="w-3 h-3" />
          <span>Embrião</span>
        </div>
      </div>

      {/* Body compacto */}
      <div className="px-3 py-3 space-y-2.5 flex-1 flex flex-col">
        {/* Mensagem principal */}
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-300 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 leading-relaxed">
            <p>
              Mapa <strong className="text-purple-200">20 categorias × keywords BR × DSM-5</strong>{' '}
              cristalizado. Smoke manual report{' '}
              <code className="px-1 rounded bg-purple-500/10 text-purple-200 text-[10px]">2bdb57fb</code>{' '}
              detectou{' '}
              <strong className="text-emerald-300">4 sinais TDAH</strong>.
            </p>
          </div>
        </div>

        {/* Roadmap fases — compacto 2x2 */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'A · Mapa', status: 'done', desc: '20 cat.' },
            { label: 'B · Calibração', status: 'pending', desc: '2-3 reais' },
            { label: 'C · Audit', status: 'in-progress', desc: '5 c/ sinais' },
            { label: 'D · Sidecar', status: 'planned', desc: 'Edge+card' },
          ].map((fase) => (
            <div
              key={fase.label}
              className={`rounded-md px-2 py-1.5 border text-center ${
                fase.status === 'done'
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : fase.status === 'in-progress'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : fase.status === 'pending'
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-slate-700/30 border-slate-600/30'
              }`}
            >
              <div className={`text-[10px] font-semibold ${
                fase.status === 'done' ? 'text-emerald-300' :
                fase.status === 'in-progress' ? 'text-amber-300' :
                fase.status === 'pending' ? 'text-purple-300' :
                'text-slate-400'
              }`}>
                {fase.label}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">{fase.desc}</div>
            </div>
          ))}
        </div>

        {/* Próximo gate compacto */}
        <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-md bg-amber-500/5 border border-amber-500/20">
          <AlertCircle className="w-3 h-3 text-amber-300/80 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-200/90 leading-snug">
            <strong>Próximo gate:</strong> Eduardo trazer 2-3 casos neuro anonimizados
            (TEA + TDAH + comorbidade) → Fase D ~4h.
          </p>
        </div>

        {/* Footer institucional compacto */}
        <p className="text-[9px] text-slate-500 italic text-center pt-1 mt-auto border-t border-purple-500/10">
          Z2 estrutural — sinaliza, não diagnostica. CFM Eduardo decide.
        </p>
      </div>
    </div>
  )
}
