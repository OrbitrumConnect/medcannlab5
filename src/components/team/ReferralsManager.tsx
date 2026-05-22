/**
 * V1.9.274 — ReferralsManager (consent-first)
 * ─────────────────────────────────────────────
 * Gerencia direcionamentos de pacientes entre médicos da equipe.
 * Aprovado Pedro+Ricardo+João 13/05 noite (LGPD art. 11 §1 + CFM 2.314 art. 8).
 *
 * Flow:
 *   1. Médico A clica "Sugerir Direcionamento"
 *   2. Modal: paciente (dropdown meus pacientes) + destino (dropdown equipe) + razão
 *   3. INSERT patient_referrals status='pending_patient_consent'
 *   4. Paciente recebe notificação (V1.9.275) e decide
 *   5. Sistema atualiza status → 'accepted' OR 'declined_by_patient'
 *
 * Princípios aplicados:
 *   - Eventos explícitos (P11): médico clica, sistema não decide
 *   - Razão controlada (sem free-text com PII)
 *   - Consent-first: Dr. B SÓ vê após paciente aceitar (RLS pr_select_to)
 */
import React, { useState, useEffect, useCallback } from 'react'
import { ArrowRightLeft, Send, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, UserPlus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'

type ReferralStatus = 'pending_patient_consent' | 'accepted' | 'declined_by_patient' | 'revoked'
type ReferralReason = 'agenda_cheia' | 'especialidade' | 'ferias' | 'segunda_opiniao' | 'outro'

interface Referral {
  id: string
  from_doctor_id: string
  to_doctor_id: string
  patient_id: string
  reason: ReferralReason
  status: ReferralStatus
  consent_given_at: string | null
  created_at: string
  // Enrichment client-side
  patient_name?: string
  to_doctor_name?: string
}

interface TeamMemberLite {
  team_member_id: string
  member_name: string
  member_specialty: string
}

interface PatientLite {
  id: string
  name: string
}

const REASON_LABELS: Record<ReferralReason, string> = {
  agenda_cheia: 'Agenda cheia',
  especialidade: 'Especialidade complementar',
  ferias: 'Férias / ausência',
  segunda_opiniao: 'Segunda opinião',
  outro: 'Outro motivo',
}

const STATUS_LABELS: Record<ReferralStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending_patient_consent: { label: 'Aguardando paciente', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30', icon: Clock },
  accepted: { label: 'Aceito pelo paciente', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle2 },
  declined_by_patient: { label: 'Recusado pelo paciente', color: 'text-rose-300 bg-rose-500/10 border-rose-500/30', icon: XCircle },
  revoked: { label: 'Cancelado', color: 'text-brand-text-muted bg-slate-500/10 border-slate-500/30', icon: XCircle },
}

interface ReferralsManagerProps {
  /** Lista de membros da equipe pra dropdown destino. */
  teamMembers: TeamMemberLite[]
}

export const ReferralsManager: React.FC<ReferralsManagerProps> = ({ teamMembers }) => {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [myPatients, setMyPatients] = useState<PatientLite[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Form state
  const [selectedPatient, setSelectedPatient] = useState('')
  const [selectedToDoctor, setSelectedToDoctor] = useState('')
  const [selectedReason, setSelectedReason] = useState<ReferralReason>('agenda_cheia')

  const loadReferrals = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await (supabase as any)
        .from('patient_referrals')
        .select('*')
        .eq('from_doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      // Enrich com nomes
      const list = (data || []) as Referral[]
      const patientIds = Array.from(new Set(list.map(r => r.patient_id)))
      const toDoctorIds = Array.from(new Set(list.map(r => r.to_doctor_id)))
      const allIds = Array.from(new Set([...patientIds, ...toDoctorIds]))
      if (allIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name')
          .in('id', allIds)
        const nameMap = new Map((usersData || []).map((u: any) => [u.id as string, u.name as string]))
        list.forEach(r => {
          r.patient_name = nameMap.get(r.patient_id) || 'Paciente'
          r.to_doctor_name = nameMap.get(r.to_doctor_id) || 'Profissional'
        })
      }
      setReferrals(list)
    } catch (err) {
      console.error('[V1.9.274] erro ao carregar referrals:', err)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const loadMyPatients = useCallback(async () => {
    if (!user?.id) return
    try {
      // Pacientes com appointment OU invited_by
      const { data: aptsData } = await supabase
        .from('appointments')
        .select('patient_id')
        .eq('professional_id', user.id)
        .neq('status', 'cancelled')
      const aptIds = Array.from(new Set((aptsData || []).map((a: any) => a.patient_id).filter(Boolean)))

      const { data: invitedData } = await supabase
        .from('users')
        .select('id')
        .eq('invited_by', user.id)
      const invitedIds = (invitedData || []).map((u: any) => u.id).filter(Boolean)

      const allIds = Array.from(new Set([...aptIds, ...invitedIds]))
      if (allIds.length === 0) {
        setMyPatients([])
        return
      }
      const { data: patientsData } = await supabase
        .from('users')
        .select('id, name')
        .in('id', allIds)
      setMyPatients((patientsData || []).map((u: any) => ({ id: u.id, name: u.name || 'Paciente' })))
    } catch (err) {
      console.error('[V1.9.274] erro ao carregar meus pacientes:', err)
      setMyPatients([])
    }
  }, [user?.id])

  useEffect(() => {
    loadReferrals()
    loadMyPatients()
  }, [loadReferrals, loadMyPatients])

  const handleSubmit = async () => {
    if (!user?.id || !selectedPatient || !selectedToDoctor) return
    if (selectedPatient === selectedToDoctor) {
      toastError('Erro', 'Paciente e destino não podem ser o mesmo.')
      return
    }
    setSubmitting(true)
    try {
      const { error } = await (supabase as any).from('patient_referrals').insert({
        from_doctor_id: user.id,
        to_doctor_id: selectedToDoctor,
        patient_id: selectedPatient,
        reason: selectedReason,
        status: 'pending_patient_consent',
      })
      if (error) throw error
      toastSuccess(
        'Sugestão enviada',
        'O paciente receberá notificação pra aceitar ou recusar o direcionamento.'
      )
      setShowModal(false)
      setSelectedPatient('')
      setSelectedToDoctor('')
      setSelectedReason('agenda_cheia')
      loadReferrals()
    } catch (err: any) {
      console.error('[V1.9.274] erro ao criar referral:', err)
      toastError('Erro', err?.message || 'Não foi possível enviar a sugestão.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (referralId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('patient_referrals')
        .update({ status: 'revoked', updated_at: new Date().toISOString() })
        .eq('id', referralId)
        .eq('status', 'pending_patient_consent')
      if (error) throw error
      toastSuccess('Cancelado', 'Sugestão cancelada antes do paciente decidir.')
      loadReferrals()
    } catch (err: any) {
      toastError('Erro', err?.message || 'Não foi possível cancelar.')
    }
  }

  const pendingReferrals = referrals.filter(r => r.status === 'pending_patient_consent')
  const historyReferrals = referrals.filter(r => r.status !== 'pending_patient_consent')

  const canCreate = myPatients.length > 0 && teamMembers.length > 0

  return (
    <section className="mt-6 bg-slate-900/40 border border-slate-700/40 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold text-brand-text">Direcionamento de Pacientes</h3>
          <span className="text-[10px] uppercase tracking-wider text-slate-500 ml-1">
            Consent-first · LGPD
          </span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={!canCreate}
          title={
            !canCreate
              ? myPatients.length === 0
                ? 'Você ainda não tem pacientes pra direcionar'
                : 'Adicione membros à sua equipe antes de direcionar'
              : 'Sugerir paciente meu pra um colega da equipe'
          }
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-brand-surface-subtle disabled:cursor-not-allowed text-slate-950 disabled:text-slate-500 rounded-lg text-sm font-bold transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Sugerir Direcionamento
        </button>
      </div>

      <p className="text-xs text-brand-text-muted mb-4 leading-relaxed">
        Sugira paciente seu pra outro profissional da sua equipe. <strong className="text-brand-text-secondary">O paciente recebe notificação e decide se aceita.</strong> Você pode cancelar antes da resposta.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pendentes */}
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-amber-400 font-bold mb-2 flex items-center gap-1.5">
              <Clock className="w-3 h-3" /> Pendentes ({pendingReferrals.length})
            </h4>
            {pendingReferrals.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 px-3 bg-slate-800/30 rounded-lg border border-brand-border-subtle">
                Nenhuma sugestão aguardando resposta do paciente.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingReferrals.map(r => (
                  <ReferralCard
                    key={r.id}
                    referral={r}
                    onCancel={() => handleCancel(r.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Histórico */}
          <div>
            <h4 className="text-[10px] uppercase tracking-wider text-brand-text-muted font-bold mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3" /> Histórico ({historyReferrals.length})
            </h4>
            {historyReferrals.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 px-3 bg-slate-800/30 rounded-lg border border-brand-border-subtle">
                Nenhum direcionamento finalizado ainda.
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {historyReferrals.map(r => (
                  <ReferralCard key={r.id} referral={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Sugerir Direcionamento */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => !submitting && setShowModal(false)}
        >
          <div
            className="bg-brand-bg border border-cyan-500/30 rounded-2xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-text mb-1">Sugerir Direcionamento</h3>
                <p className="text-xs text-brand-text-muted">
                  O paciente decidirá se aceita compartilhar vínculo com o destino.
                </p>
              </div>
              <button
                onClick={() => !submitting && setShowModal(false)}
                className="text-brand-text-muted hover:text-brand-text p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-brand-text-secondary font-semibold mb-1.5">Paciente</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Selecione um paciente seu...</option>
                  {myPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-brand-text-secondary font-semibold mb-1.5">Direcionar para</label>
                <select
                  value={selectedToDoctor}
                  onChange={(e) => setSelectedToDoctor(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text focus:border-cyan-500 focus:outline-none"
                >
                  <option value="">Selecione um colega da equipe...</option>
                  {teamMembers.map(m => (
                    <option key={m.team_member_id} value={m.team_member_id}>
                      {m.member_name} {m.member_specialty ? `· ${m.member_specialty}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-brand-text-secondary font-semibold mb-1.5">Razão</label>
                <div className="grid grid-cols-1 gap-1.5">
                  {(Object.keys(REASON_LABELS) as ReferralReason[]).map(r => (
                    <label
                      key={r}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${
                        selectedReason === r
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-brand-text'
                          : 'bg-slate-800/40 border-brand-border text-brand-text-secondary hover:bg-brand-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={selectedReason === r}
                        onChange={() => setSelectedReason(r)}
                        className="accent-cyan-500"
                      />
                      <span className="text-sm">{REASON_LABELS[r]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-200 leading-relaxed">
                    O paciente receberá notificação no app e decidirá se aceita compartilhar seu vínculo com o profissional indicado. Você pode cancelar antes da resposta.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setShowModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-brand-surface hover:bg-brand-surface-subtle text-slate-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedPatient || !selectedToDoctor}
                className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-brand-surface-subtle disabled:cursor-not-allowed text-slate-950 disabled:text-slate-500 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar sugestão
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

/** Card compacto pra cada referral. */
const ReferralCard: React.FC<{
  referral: Referral
  onCancel?: () => void
}> = ({ referral, onCancel }) => {
  const statusCfg = STATUS_LABELS[referral.status]
  const StatusIcon = statusCfg.icon
  const dateStr = new Date(referral.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-3 text-xs">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-brand-text font-semibold truncate">
            {referral.patient_name} <span className="text-slate-500">→</span> {referral.to_doctor_name}
          </p>
          <p className="text-[10px] text-brand-text-muted mt-0.5">
            {REASON_LABELS[referral.reason]} · {dateStr}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusCfg.color}`}>
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </span>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-[10px] text-rose-400 hover:text-rose-300 font-medium hover:underline"
        >
          Cancelar sugestão
        </button>
      )}
    </div>
  )
}

export default ReferralsManager
