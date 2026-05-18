import React, { useEffect, useState } from 'react'
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// [V1.9.353] (18/05): Mini card função renal pra paciente.
// Memory: feedback_mini_card_renal_paciente_parqueado_18_05.
// Mostra último exame APROVADO (renal_exams), histórico curto, tendência sutil.
// Decisão UX Pedro 18/05:
//   1. Só `approved` (renal_exams oficial, não renal_inline_suggestions pending)
//   2. Linguagem híbrida: "G2 — Redução leve" (técnica + leiga)
//   3. Posição: dentro da right column do PatientAnalytics, após Insights
// RLS já permite: policy "Patients can view own renal exams" (validado empírico 18/05).

interface RenalExam {
  id: string
  exam_date: string
  creatinine: number | null
  egfr: number | null
  drc_stage: string | null
}

// Tradução leiga dos estágios CKD (KDIGO 2012 + linguagem paciente-friendly)
const STAGE_LEIGO: Record<string, { label: string; tone: 'good' | 'mild' | 'moderate' | 'severe' | 'critical' }> = {
  'G1': { label: 'Normal ou Elevado', tone: 'good' },
  'G2': { label: 'Redução leve', tone: 'mild' },
  'G3a': { label: 'Redução leve a moderada', tone: 'moderate' },
  'G3b': { label: 'Redução moderada a grave', tone: 'moderate' },
  'G4': { label: 'Redução grave', tone: 'severe' },
  'G5': { label: 'Falência renal', tone: 'critical' },
}

const TONE_STYLES = {
  good: { ring: 'ring-emerald-500/40', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  mild: { ring: 'ring-emerald-500/30', text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  moderate: { ring: 'ring-amber-500/40', text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  severe: { ring: 'ring-orange-500/40', text: 'text-orange-300', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  critical: { ring: 'ring-red-500/40', text: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/30' },
}

export const PatientRenalCard: React.FC = () => {
  const { user } = useAuth()
  const [exams, setExams] = useState<RenalExam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('renal_exams')
          .select('id, exam_date, creatinine, egfr, drc_stage')
          .eq('patient_id', user.id)
          .order('exam_date', { ascending: false })
          .limit(5)
        if (cancelled) return
        if (error) {
          console.warn('[PatientRenalCard] fetch falhou:', error.message)
          setExams([])
        } else {
          setExams(data || [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [user?.id])

  // Tendência: comparar egfr último vs penúltimo
  const trend = (() => {
    if (exams.length < 2) return null
    const latest = exams[0]?.egfr
    const previous = exams[1]?.egfr
    if (latest == null || previous == null) return null
    const diff = latest - previous
    if (Math.abs(diff) < 3) return { icon: Minus, label: 'Estável', color: 'text-slate-400' }
    if (diff > 0) return { icon: TrendingUp, label: 'Melhora', color: 'text-emerald-400' }
    return { icon: TrendingDown, label: 'Reducão', color: 'text-amber-400' }
  })()

  // Loading state
  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Função Renal
        </h3>
        <p className="text-xs text-slate-500">Carregando...</p>
      </div>
    )
  }

  // Empty state — nenhum exame aprovado ainda
  if (exams.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Função Renal
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Quando seu médico registrar um exame de função renal (ou quando você mencionar um valor à Nôa durante a avaliação clínica e seu médico aprovar), o resultado aparecerá aqui.
        </p>
      </div>
    )
  }

  const latest = exams[0]
  const stageInfo = latest.drc_stage ? STAGE_LEIGO[latest.drc_stage] : null
  const tone = stageInfo?.tone || 'good'
  const styles = TONE_STYLES[tone]
  const examDate = latest.exam_date
    ? new Date(latest.exam_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} backdrop-blur-sm p-5 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 w-32 h-32 ${styles.bg} rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none`}></div>

      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 relative z-10">
        <Activity className={`w-5 h-5 ${styles.text}`} />
        Função Renal
      </h3>

      <div className="space-y-3 relative z-10">
        {/* TFG principal */}
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">
            {latest.egfr != null ? Number(latest.egfr).toFixed(1) : '—'}
          </span>
          <span className="text-xs text-slate-400">mL/min/1.73m²</span>
        </div>

        {/* Estágio (técnico + leigo) */}
        {latest.drc_stage && stageInfo && (
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${styles.bg} border ${styles.border}`}>
            <span className={`text-xs font-bold ${styles.text}`}>{latest.drc_stage}</span>
            <span className="text-xs text-slate-300">— {stageInfo.label}</span>
          </div>
        )}

        {/* Data + tendência */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/40">
          <span className="text-xs text-slate-400">
            Último: <span className="text-slate-200 font-medium">{examDate}</span>
          </span>
          {trend && (
            <span className={`flex items-center gap-1 text-xs ${trend.color}`}>
              <trend.icon className="w-3.5 h-3.5" />
              <span className="font-medium">{trend.label}</span>
            </span>
          )}
        </div>

        {/* Disclaimer leigo */}
        <p className="text-[10px] text-slate-500 leading-relaxed pt-1">
          Resultado calculado a partir da creatinina (CKD-EPI 2021). Aprovado pelo seu médico em {examDate}. Interpretação clínica deve ser feita pelo profissional responsável.
        </p>
      </div>
    </div>
  )
}

export default PatientRenalCard
