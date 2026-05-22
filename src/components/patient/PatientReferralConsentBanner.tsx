/**
 * V1.9.275 — Banner de consent pra referrals pendentes (paciente)
 * ────────────────────────────────────────────────────────────────
 * Aprovado Pedro+Ricardo+João 13/05 noite.
 *
 * Funcionamento:
 *   1. Hook carrega patient_referrals WHERE patient_id=user.id AND status='pending_patient_consent'
 *   2. Se houver pendentes → banner amber visível no topo do dashboard paciente
 *   3. Click no banner → modal com texto consent claro:
 *      "Dr. A (referência) sugere Dr. B (especialidade). Razão: X.
 *       Você aceita compartilhar seu vínculo com Dr. B?"
 *   4. [Recuso] → UPDATE status='declined_by_patient'
 *   5. [Aceito] → UPDATE status='accepted', consent_given_at=NOW()
 *      → Dr. B passa a ver paciente (via RLS pr_select_to)
 *
 * Princípios:
 *   - LGPD art. 11 §1 (consentimento explícito dado de saúde)
 *   - LGPD art. 9 (transparência: paciente vê quem sugere, motivo)
 *   - LGPD art. 18 VI (direito esquecimento: pode revogar mesmo aceito)
 *   - CFM 2.314 art. 8 (interconsulta com consentimento prévio)
 *   - Princípio 11 (eventos explícitos: clique humano em ambas)
 */
import React, { useState, useEffect, useCallback } from 'react'
import { ArrowRightLeft, CheckCircle2, XCircle, Loader2, AlertCircle, UserCheck } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

type ReferralReason = 'agenda_cheia' | 'especialidade' | 'ferias' | 'segunda_opiniao' | 'outro'

interface PendingReferral {
  id: string
  from_doctor_id: string
  to_doctor_id: string
  reason: ReferralReason
  created_at: string
  from_doctor_name?: string
  to_doctor_name?: string
  to_doctor_specialty?: string
}

const REASON_LABELS: Record<ReferralReason, string> = {
  agenda_cheia: 'Agenda cheia',
  especialidade: 'Especialidade complementar',
  ferias: 'Férias / ausência',
  segunda_opiniao: 'Segunda opinião',
  outro: 'Outro motivo',
}

export const PatientReferralConsentBanner: React.FC = () => {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [pending, setPending] = useState<PendingReferral[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReferral, setSelectedReferral] = useState<PendingReferral | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadPending = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await (supabase as any)
        .from('patient_referrals')
        .select('id, from_doctor_id, to_doctor_id, reason, created_at')
        .eq('patient_id', user.id)
        .eq('status', 'pending_patient_consent')
        .order('created_at', { ascending: false })
      if (error) throw error
      const list = (data || []) as PendingReferral[]
      if (list.length > 0) {
        const doctorIds = Array.from(new Set(list.flatMap(r => [r.from_doctor_id, r.to_doctor_id])))
        const { data: doctorsData } = await supabase
          .from('users')
          .select('id, name, specialty')
          .in('id', doctorIds)
        const docMap = new Map((doctorsData || []).map((u: any) => [u.id, u]))
        list.forEach(r => {
          const from = docMap.get(r.from_doctor_id) as any
          const to = docMap.get(r.to_doctor_id) as any
          r.from_doctor_name = from?.name || 'Profissional'
          r.to_doctor_name = to?.name || 'Profissional'
          r.to_doctor_specialty = to?.specialty || ''
        })
      }
      setPending(list)
    } catch (err) {
      console.warn('[V1.9.275] erro ao carregar referrals pendentes (RLS?):', err)
      setPending([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadPending()
  }, [loadPending])

  const handleDecision = async (decision: 'accepted' | 'declined_by_patient') => {
    if (!selectedReferral) return
    setSubmitting(true)
    try {
      const payload: any = {
        status: decision,
        updated_at: new Date().toISOString(),
      }
      if (decision === 'accepted') {
        payload.consent_given_at = new Date().toISOString()
      }
      const { error } = await (supabase as any)
        .from('patient_referrals')
        .update(payload)
        .eq('id', selectedReferral.id)
        .eq('status', 'pending_patient_consent')
      if (error) throw error
      toastSuccess(
        decision === 'accepted' ? 'Direcionamento aceito' : 'Direcionamento recusado',
        decision === 'accepted'
          ? `Dr(a). ${selectedReferral.to_doctor_name} agora poderá acessar seu vínculo. Você pode revogar a qualquer momento.`
          : `Dr(a). ${selectedReferral.from_doctor_name} foi avisado(a) que você recusou. Nenhum dado foi compartilhado.`
      )
      setSelectedReferral(null)
      loadPending()
    } catch (err: any) {
      console.error('[V1.9.275] erro ao decidir referral:', err)
      toastError('Erro', err?.message || 'Não foi possível registrar sua decisão.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || pending.length === 0) {
    return null
  }

  return (
    <>
      {/* Banner persistente no topo do dashboard quando há pendentes */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border border-amber-500/40 rounded-xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-brand-text mb-1">
              {pending.length === 1
                ? 'Você tem um direcionamento aguardando sua decisão'
                : `Você tem ${pending.length} direcionamentos aguardando sua decisão`}
            </h3>
            <p className="text-xs text-amber-100/90 mb-3 leading-relaxed">
              Seu profissional de referência sugeriu acompanhamento com outro profissional da rede de cuidado dele. Você decide se aceita.
            </p>
            <div className="space-y-2">
              {pending.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReferral(r)}
                  className="w-full text-left bg-slate-900/60 hover:bg-slate-900/80 border border-amber-500/30 hover:border-amber-400 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-xs text-brand-text-secondary mb-1">
                    <ArrowRightLeft className="w-3 h-3 text-amber-400" />
                    <span><strong className="text-brand-text">{r.from_doctor_name}</strong> sugere acompanhamento com <strong className="text-cyan-300">{r.to_doctor_name}</strong></span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[10px] text-brand-text-muted">
                      {REASON_LABELS[r.reason]} · {new Date(r.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    <span className="text-[11px] text-amber-300 font-bold group-hover:text-amber-200">
                      Decidir →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de decisão */}
      {selectedReferral && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !submitting && setSelectedReferral(null)}
        >
          <div
            className="bg-brand-bg border border-amber-500/30 rounded-2xl max-w-lg w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-text">Sugestão de Direcionamento</h3>
                  <p className="text-[11px] text-brand-text-muted">Sua decisão é definitiva — você pode revogar depois</p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setSelectedReferral(null)}
                className="text-brand-text-muted hover:text-brand-text p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-800/40 border border-brand-border rounded-lg p-4">
                <p className="text-sm text-slate-200 leading-relaxed">
                  <strong className="text-brand-text">{selectedReferral.from_doctor_name}</strong>
                  {' '}(seu profissional de referência) sugere que você seja acompanhado também por:
                </p>
                <div className="mt-3 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-cyan-200 font-bold">
                    {selectedReferral.to_doctor_name}
                  </p>
                  {selectedReferral.to_doctor_specialty && (
                    <p className="text-xs text-cyan-300/80 mt-0.5">
                      {selectedReferral.to_doctor_specialty}
                    </p>
                  )}
                </div>
                <p className="text-xs text-brand-text-muted mt-3">
                  <strong className="text-brand-text-secondary">Razão:</strong> {REASON_LABELS[selectedReferral.reason]}
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                  <div className="text-[11px] text-blue-100 leading-relaxed space-y-1">
                    <p><strong>Se você aceita:</strong> {selectedReferral.to_doctor_name} passa a poder ver seu vínculo na plataforma e te receber em consulta. Seu histórico clínico permanece com seu profissional de referência — nada é transferido automaticamente.</p>
                    <p><strong>Se você recusa:</strong> nada acontece. Seu profissional de referência será informado da sua decisão. Nenhum dado é compartilhado com o profissional sugerido.</p>
                    <p><strong>Direito de revogação (LGPD art. 18):</strong> mesmo aceitando agora, você pode revogar a qualquer momento no seu painel de privacidade.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => handleDecision('declined_by_patient')}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-brand-surface hover:bg-brand-surface-subtle text-slate-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Recuso
              </button>
              <button
                onClick={() => handleDecision('accepted')}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-brand-surface-subtle text-slate-950 disabled:text-slate-500 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Aceito direcionamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PatientReferralConsentBanner
