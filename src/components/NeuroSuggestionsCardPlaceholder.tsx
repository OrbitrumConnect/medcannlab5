/**
 * NeuroSuggestionsCardPlaceholder — V1.9.475 (27/05/2026)
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
 * - Eduardo Faveret (sócio neuro) — `eduardoscfaveret@gmail.com` ou type=professional+specialty='neuro'
 * - Admin (Pedro) — vê tudo
 * - Ricardo (nefrologia) — NÃO vê (Renal card é dele)
 * - Outros profissionais — NÃO vê
 *
 * Memórias relacionadas:
 * - project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05 (mapa Fase A)
 * - project_smoke_neuro_signal_report_2bdb57fb_27_05 (smoke manual 4 sinais TDAH)
 * - feedback_mapear_universo_vetores_antes_de_codar_guardrail_24_05 (mapear primeiro)
 *
 * Princípio aplicado: anti-cristalização-prematura. Card embrião sem dados =
 * UI feedback Eduardo+Ricardo SEM forçar codificação Edge especulativa.
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

  // [V1.9.475] Visibilidade: Eduardo (neuro) + admin (Pedro). Ricardo (nefrologia)
  // NÃO vê — Renal card é dele. Princípio RLS por especialidade médica.
  const isEduardo = userCtx.email === 'eduardoscfaveret@gmail.com'
  const isAdmin = userCtx.type === 'admin'

  if (!isEduardo && !isAdmin) return null

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 via-slate-900/60 to-indigo-900/20 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Brain className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-purple-100 flex items-center gap-1.5">
              Sugestões Neuro
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200 font-normal">
                TEA · TDAH · TOD
              </span>
            </h3>
            <p className="text-[11px] text-purple-300/70 mt-0.5">
              Sidecar cognitivo em calibração — Fase A ✓ Fase B 🟡
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-purple-300/60">
          <Hourglass className="w-3 h-3" />
          <span>Embrião visual</span>
        </div>
      </div>

      {/* Body — explicação roadmap */}
      <div className="px-4 py-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-300 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <p className="mb-2">
              Mapa neuro <strong className="text-purple-200">20 categorias × keywords BR × DSM-5 adaptado</strong>{' '}
              cristalizado (Fase A). Smoke manual no report{' '}
              <code className="px-1 py-0.5 rounded bg-purple-500/10 text-purple-200 text-[10px]">2bdb57fb</code>{' '}
              detectou <strong className="text-emerald-300">4 sinais TDAH compatíveis</strong>{' '}
              (desatenção × 2, comorbidade emocional, terapêutico indireto).
            </p>
            <p className="text-slate-400">
              Sidecar codificado quando Fase B materializar (2-3 casos neuro reais).
            </p>
          </div>
        </div>

        {/* Roadmap fases */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[
            { label: 'A · Mapa', status: 'done', desc: '20 cat. × keywords' },
            { label: 'B · Calibração', status: 'pending', desc: '2-3 casos reais' },
            { label: 'C · Audit', status: 'in-progress', desc: '5 reports c/ sinais' },
            { label: 'D · Sidecar', status: 'planned', desc: 'Edge + tabela + card' },
          ].map((fase) => (
            <div
              key={fase.label}
              className={`rounded-lg p-2 border text-center ${
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
              <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">{fase.desc}</div>
            </div>
          ))}
        </div>

        {/* Próximo gate */}
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-amber-300/80 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-200/90 leading-relaxed">
            <strong>Próximo gate:</strong> Dr. Eduardo Faveret trazer 2-3 casos neuro
            anonimizados (TEA puro + TDAH puro + comorbidade) pra calibração empírica das keywords.
            Após Fase B → codificação Fase D (~4h dev seguindo pattern do Sidecar Renal V1.9.307).
          </p>
        </div>

        {/* Footer institucional */}
        <p className="text-[10px] text-slate-500 italic text-center pt-1 border-t border-purple-500/10">
          Sidecar cognitivo Z2 estrutural — sinaliza compatibilidade, não diagnostica.
          Interpretação clínica é ato médico CFM (Dr. Eduardo Faveret).
        </p>
      </div>
    </div>
  )
}
