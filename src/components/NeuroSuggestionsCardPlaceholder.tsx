/**
 * NeuroSuggestionsCardPlaceholder — V1.9.475 (27/05/2026)
 * V1.9.475-A (27/05 23h) — layout compacto preparado pra side-by-side
 * V1.9.475-B (27/05 23h35) — CORREÇÃO conceitual visibilidade (feedback Pedro)
 * V1.9.475-C (27/05 23h50) — Audit Manual Fase C dentro do card (4 sinais TDAH
 *   detectados empíricamente no report 2bdb57fb hardcoded até Fase D codada)
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
 * V1.9.475-B — VISIBILIDADE CONCEITUAL CORRIGIDA (Pedro 27/05 23h):
 *
 * ❌ ANTES (V1.9.475/A): restringia por especialidade médica (só Eduardo+admin)
 * ✅ AGORA (V1.9.475-B): cada médico vê sidecar do PACIENTE DELE (vínculo via
 *    appointments), independente da especialidade do médico.
 *
 * Princípio Pedro: "se Ricardo tem caso com sinal neuro, ele vê o card.
 * Se Eduardo tem caso com sinal renal, ele vê o card renal. Não restringe
 * por especialidade do médico — restringe por vínculo paciente-médico."
 *
 * Implementação placeholder (sem dados ainda):
 * - Aparece pra TODOS profissionais + admin (embrião visual = roadmap institucional)
 * - NÃO aparece pra pacientes ou alunos
 * - Quando Fase D codada (Edge + tabela), RLS BD por paciente-médico
 *   aplicada igual sidecar Renal V1.9.307 (vínculo appointments)
 *
 * Memórias relacionadas:
 * - project_universo_sinais_neuro_tea_tod_tdah_mapa_completo_27_05
 * - project_smoke_neuro_signal_report_2bdb57fb_27_05
 */

import { Brain, Sparkles, Hourglass, AlertCircle, FlaskConical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// [V1.9.475-C] Sinais detectados empíricamente via smoke manual no report
// 2bdb57fb (Eduardo simulando paciente médico burnout via passosmir4@gmail.com,
// 27/05 21:33-22:05 BRT — 33min AEC completa, ICP signed).
// Análise manual aplicada sobre conversa de 20 mensagens (ai_chat_interactions).
// Documentado em diário 27/05 Bloco N.9 + memory project_smoke_neuro_signal_report_2bdb57fb_27_05.
// FONTE de dados: hardcoded (placeholder pré-Fase D). Quando Edge `neuro-signal-extractor`
// codificada, fetch real da tabela `clinical_neuro_signals` substitui esse array.
interface NeuroSignalManual {
  categoria: string
  fala_literal: string
  confianca: number
}

const SINAIS_MANUAIS_2BDB57FB: NeuroSignalManual[] = [
  { categoria: 'TDAH-Desatenção', fala_literal: 'dificuldade de me concentrar', confianca: 92 },
  { categoria: 'TDAH-Desatenção', fala_literal: 'preciso me concentrar diante de muitas demandas como médico', confianca: 88 },
  { categoria: 'TDAH-Comorbidade Emocional', fala_literal: 'ansiedade + depressão + burn-out há 3 anos', confianca: 65 },
  { categoria: 'TDAH-Terapêutico Indireto', fala_literal: 'bupropiona' /* off-label TDAH adulto */, confianca: 55 },
]

function confidenceColor(conf: number): string {
  if (conf >= 80) return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
  if (conf >= 60) return 'text-amber-300 bg-amber-500/10 border-amber-500/30'
  return 'text-orange-300 bg-orange-500/10 border-orange-500/30'
}

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

  // [V1.9.475-B] Visibilidade conceitual corrigida (Pedro 27/05 23h):
  // Card aparece pra TODOS profissionais + admin (embrião visual = roadmap institucional).
  // Quando Fase D codada, RLS BD aplica restrição por vínculo paciente-médico
  // (igual sidecar Renal V1.9.307) — NÃO por especialidade do médico.
  // Pacientes e alunos NÃO veem (placeholder é pra fluxo profissional).
  const isProfessional = userCtx.type === 'professional' || userCtx.type === 'profissional'
  const isAdmin = userCtx.type === 'admin'

  if (!isProfessional && !isAdmin) return null

  return (
    // [V1.9.476-A] max-w-md REMOVIDO (estava em V1.9.475-E). Agora grid externo
    // 2-col max em ProfessionalMyDashboard:937 garante paridade visual com
    // Renal. Card Neuro ocupa coluna inteira (lg+ ~480-500px). Feedback Pedro
    // 28/05 00:45 BRT.
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
        {/* [V1.9.476-A] Trigger validação status — paridade visual ao Card Renal
            que mostra "✓ Aprovada por Dr. Ricardo Valença". Card Neuro mostra
            status atual: audit manual aguardando validação Dr. Eduardo Faveret.
            Quando Eduardo validar Fase B + Edge codada, troca pra "✓ Validado".
            Feedback Pedro 28/05 00:45 BRT: trigger validação visual ausente. */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30">
          <Hourglass className="w-3 h-3 text-amber-300 flex-shrink-0" />
          <span className="text-[10px] text-amber-200 font-semibold">
            Audit manual · aguardando validação Dr. Eduardo Faveret
          </span>
        </div>

        {/* Mensagem principal — V1.9.475-C condensada (audit detalhado abaixo) */}
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-purple-300 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-300 leading-relaxed">
            <p>
              Mapa <strong className="text-purple-200">20 categorias × keywords BR × DSM-5</strong>{' '}
              cristalizado. Detecção manual aplicada sobre report real (audit Fase C abaixo).
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

        {/* [V1.9.475-C] Audit Manual Fase C — 1 detecção empírica preliminar.
            Sinais foram detectados manualmente pelo Claude na sessão 27/05
            sobre conversa REAL armazenada em ai_chat_interactions. NÃO é mock —
            é audit manual antecipando o que Edge `neuro-signal-extractor`
            (Fase D) vai fazer automaticamente. */}
        <div className="rounded-md border border-purple-500/25 bg-purple-500/5 overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-purple-500/10 border-b border-purple-500/20">
            <div className="flex items-center gap-1.5">
              <FlaskConical className="w-3 h-3 text-purple-300" />
              <span className="text-[10px] font-semibold text-purple-100">
                Audit Manual Fase C
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-200">
                1 report
              </span>
            </div>
            <span className="text-[9px] text-purple-300/70">
              4 sinais TDAH
            </span>
          </div>

          <div className="px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 pb-1 border-b border-purple-500/10">
              <span>Paciente teste · <code className="text-purple-200">passosmir4</code></span>
              <span>27/05 · ICP signed</span>
            </div>

            {SINAIS_MANUAIS_2BDB57FB.map((sinal, idx) => (
              <div key={idx} className="flex items-start gap-1.5 text-[10px] leading-tight">
                <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${confidenceColor(sinal.confianca)}`}>
                  {sinal.confianca}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-purple-200/90 font-medium">{sinal.categoria}</div>
                  <div className="text-slate-400 italic truncate" title={sinal.fala_literal}>
                    "{sinal.fala_literal}"
                  </div>
                </div>
              </div>
            ))}

            <p className="text-[9px] text-slate-500 italic pt-1 mt-1 border-t border-purple-500/10">
              Detectado manualmente em sessão. Edge `neuro-signal-extractor` (Fase D) automatiza esta extração quando codificada.
            </p>
          </div>
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
