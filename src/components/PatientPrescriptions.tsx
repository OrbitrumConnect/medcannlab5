/**
 * V1.9.124 — Aba Minhas Prescrições (Paciente)
 *
 * Lista cfm_prescriptions (oficiais ICP-Brasil) + patient_prescriptions
 * (plano terapêutico). RLS já permite paciente ver suas próprias
 * (cfm_prescriptions: "Admins and owners can view"; patient_prescriptions:
 * "Users can view relevant prescriptions").
 *
 * Banco intocado, schema existente, padrão alinhado com ClinicalReports.
 */
import { useState, useEffect, useCallback } from 'react'
import { Pill, FileText, ShieldCheck, ExternalLink, Loader2, AlertCircle, RefreshCw, ChevronRight, Calendar, Stethoscope } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface CfmPrescription {
  id: string
  prescription_type: string | null
  professional_name: string | null
  professional_crm: string | null
  professional_specialty: string | null
  medications: any
  notes: string | null
  status: string | null
  signature_timestamp: string | null
  iti_validation_url: string | null
  iti_qr_code: string | null
  expires_at: string | null
  created_at: string
  document_level: string | null
}

interface PatientPrescription {
  id: string
  title: string | null
  summary: string | null
  rationality: string | null
  dosage: string | null
  frequency: string | null
  duration: string | null
  instructions: string | null
  status: string | null
  issued_at: string | null
  starts_at: string | null
  ends_at: string | null
  professional_id: string | null
}

interface ProfessionalRow {
  id: string
  name: string | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Ativa',     color: 'emerald' },
  draft:     { label: 'Rascunho',  color: 'slate' },
  completed: { label: 'Concluída', color: 'blue' },
  suspended: { label: 'Suspensa',  color: 'amber' },
  cancelled: { label: 'Cancelada', color: 'rose' },
  signed:    { label: 'Assinada',  color: 'emerald' },
  sent:      { label: 'Enviada',   color: 'blue' },
  expired:   { label: 'Expirada',  color: 'rose' },
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch {
    return ''
  }
}

function StatusBadge({ status }: { status: string | null }) {
  const cfg = (status && STATUS_LABELS[status.toLowerCase()]) || { label: status || 'Pendente', color: 'slate' }
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    slate:   'bg-slate-500/15 text-slate-300 border-slate-500/30',
    blue:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
    amber:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose:    'bg-rose-500/15 text-rose-300 border-rose-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colorMap[cfg.color]}`}>
      {cfg.label}
    </span>
  )
}

function CfmPrescriptionCard({ rx }: { rx: CfmPrescription }) {
  const meds = Array.isArray(rx.medications) ? rx.medications : []
  const firstMed = meds[0]
  const isSigned = !!rx.signature_timestamp

  return (
    <div className="bg-slate-900/40 border border-amber-500/20 rounded-2xl p-4 sm:p-5 hover:border-amber-500/40 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-amber-500/15 rounded-lg flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-amber-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-white text-sm sm:text-base">
              {rx.prescription_type || 'Receita CFM'}
            </h3>
            <StatusBadge status={rx.status} />
            {isSigned && (
              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded font-medium">
                ICP-Brasil
              </span>
            )}
          </div>
          {rx.professional_name && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {rx.professional_name}
                {rx.professional_crm && ` · CRM ${rx.professional_crm}`}
              </span>
            </p>
          )}
        </div>
      </div>

      {firstMed && (
        <div className="bg-slate-950/40 rounded-lg p-3 mb-3 border border-white/5">
          <p className="text-xs text-slate-400 mb-1">Medicação principal</p>
          <p className="text-sm text-slate-200 font-medium">
            {firstMed.name || firstMed.medication || JSON.stringify(firstMed).slice(0, 80)}
          </p>
          {firstMed.dosage && <p className="text-xs text-slate-400 mt-0.5">{firstMed.dosage}</p>}
          {meds.length > 1 && (
            <p className="text-xs text-amber-300/70 mt-2">+ {meds.length - 1} medicação(ões) adicional(is)</p>
          )}
        </div>
      )}

      {rx.notes && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{rx.notes}</p>
      )}

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
          {isSigned && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(rx.signature_timestamp)}
            </span>
          )}
          {rx.expires_at && (
            <span className="text-amber-300/70">Validade: {formatDate(rx.expires_at)}</span>
          )}
        </div>
        {rx.iti_validation_url && (
          <a
            href={rx.iti_validation_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors flex-shrink-0"
          >
            Validar ITI <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

function PatientPrescriptionCard({ rx, professionalName }: { rx: PatientPrescription; professionalName?: string }) {
  return (
    <div className="bg-slate-900/40 border border-blue-500/20 rounded-2xl p-4 sm:p-5 hover:border-blue-500/40 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-blue-500/15 rounded-lg flex-shrink-0">
          <Pill className="w-5 h-5 text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-white text-sm sm:text-base">
              {rx.title || 'Plano Terapêutico'}
            </h3>
            <StatusBadge status={rx.status} />
            {rx.rationality && (
              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded font-medium uppercase">
                {rx.rationality}
              </span>
            )}
          </div>
          {professionalName && (
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{professionalName}</span>
            </p>
          )}
        </div>
      </div>

      {rx.summary && (
        <p className="text-sm text-slate-300 mb-3">{rx.summary}</p>
      )}

      {(rx.dosage || rx.frequency || rx.duration) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
          {rx.dosage && (
            <div className="bg-slate-950/40 rounded-lg p-2 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">Dosagem</p>
              <p className="text-xs text-slate-200">{rx.dosage}</p>
            </div>
          )}
          {rx.frequency && (
            <div className="bg-slate-950/40 rounded-lg p-2 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">Frequência</p>
              <p className="text-xs text-slate-200">{rx.frequency}</p>
            </div>
          )}
          {rx.duration && (
            <div className="bg-slate-950/40 rounded-lg p-2 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase">Duração</p>
              <p className="text-xs text-slate-200">{rx.duration}</p>
            </div>
          )}
        </div>
      )}

      {rx.instructions && (
        <p className="text-xs text-slate-400 mb-3 line-clamp-3">{rx.instructions}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400 pt-3 border-t border-white/5 flex-wrap">
        {rx.starts_at && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Início: {formatDate(rx.starts_at)}
          </span>
        )}
        {rx.ends_at && (
          <span className="text-amber-300/70">· Fim: {formatDate(rx.ends_at)}</span>
        )}
      </div>
    </div>
  )
}

interface Props {
  className?: string
  onBack?: () => void
}

export function PatientPrescriptions({ className = '', onBack }: Props) {
  const { user } = useAuth()
  const [cfmList, setCfmList] = useState<CfmPrescription[]>([])
  const [planList, setPlanList] = useState<PatientPrescription[]>([])
  const [professionals, setProfessionals] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const [cfmRes, planRes] = await Promise.all([
        supabase
          .from('cfm_prescriptions')
          .select('id, prescription_type, professional_name, professional_crm, professional_specialty, medications, notes, status, signature_timestamp, iti_validation_url, iti_qr_code, expires_at, created_at, document_level')
          .eq('patient_id', user.id)
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('patient_prescriptions')
          .select('id, title, summary, rationality, dosage, frequency, duration, instructions, status, issued_at, starts_at, ends_at, professional_id')
          .eq('patient_id', user.id)
          .order('issued_at', { ascending: false })
      ])

      if (cfmRes.error) console.warn('cfm_prescriptions error:', cfmRes.error.message)
      if (planRes.error) console.warn('patient_prescriptions error:', planRes.error.message)

      const cfm = (cfmRes.data || []) as CfmPrescription[]
      const plan = (planRes.data || []) as PatientPrescription[]

      const proIds = Array.from(new Set(plan.map(p => p.professional_id).filter(Boolean))) as string[]
      if (proIds.length > 0) {
        const { data: pros } = await supabase
          .from('users')
          .select('id, name')
          .in('id', proIds)
        const map: Record<string, string> = {}
        ;(pros as ProfessionalRow[] | null)?.forEach(p => {
          if (p.name) map[p.id] = p.name
        })
        setProfessionals(map)
      }

      setCfmList(cfm)
      setPlanList(plan)
    } catch (e: any) {
      console.error('Erro ao carregar prescrições:', e)
      setError(e?.message || 'Falha ao carregar prescrições')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { load() }, [load])

  const totalCfm = cfmList.length
  const totalPlan = planList.length
  const total = totalCfm + totalPlan

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${className}`}>
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Carregando suas prescrições...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/15 rounded-lg border border-amber-500/30">
            <Pill className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Minhas Prescrições</h2>
            <p className="text-xs text-slate-400">
              {total === 0 ? 'Nenhuma prescrição registrada ainda' : `${total} prescrição(ões) registrada(s)`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-sm text-slate-300"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-rose-200 font-medium">Erro ao carregar</p>
            <p className="text-xs text-rose-300/70 mt-1">{error}</p>
          </div>
        </div>
      )}

      {total === 0 && !error && (
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 text-center">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma prescrição ainda</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Quando seu médico emitir prescrições para você (receitas oficiais ou plano terapêutico integrado), elas aparecerão aqui.
          </p>
        </div>
      )}

      {totalCfm > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <h3 className="text-sm font-semibold text-amber-200 uppercase tracking-wide">
              Receitas Oficiais (CFM)
            </h3>
            <span className="text-xs text-slate-500">· {totalCfm}</span>
          </div>
          <div className="grid gap-3">
            {cfmList.map(rx => (
              <CfmPrescriptionCard key={rx.id} rx={rx} />
            ))}
          </div>
        </div>
      )}

      {totalPlan > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-300" />
            <h3 className="text-sm font-semibold text-blue-200 uppercase tracking-wide">
              Plano Terapêutico Integrado
            </h3>
            <span className="text-xs text-slate-500">· {totalPlan}</span>
          </div>
          <div className="grid gap-3">
            {planList.map(rx => (
              <PatientPrescriptionCard
                key={rx.id}
                rx={rx}
                professionalName={rx.professional_id ? professionals[rx.professional_id] : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientPrescriptions
