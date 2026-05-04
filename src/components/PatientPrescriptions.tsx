/**
 * V1.9.124-B — Aba Minhas Prescrições (Paciente) + paginação + cards compactos
 *
 * Lista cfm_prescriptions (oficiais ICP-Brasil) + patient_prescriptions
 * (plano terapêutico). RLS já permite paciente ver suas próprias.
 *
 * V1.9.124-B (pós-feedback Pedro): cards compactos (60% menores) + paginação 5/pg.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Pill, FileText, ShieldCheck, ExternalLink, Loader2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Stethoscope } from 'lucide-react'
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

const PAGE_SIZE = 5

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
    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${colorMap[cfg.color]}`}>
      {cfg.label}
    </span>
  )
}

function CfmPrescriptionCard({ rx }: { rx: CfmPrescription }) {
  const meds = Array.isArray(rx.medications) ? rx.medications : []
  const firstMed = meds[0]
  const isSigned = !!rx.signature_timestamp
  const medName = firstMed?.name || firstMed?.medication || (firstMed ? JSON.stringify(firstMed).slice(0, 50) : null)

  return (
    <div className="bg-slate-900/40 border border-amber-500/20 rounded-xl px-3 py-2.5 hover:border-amber-500/40 transition-all">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-amber-500/15 rounded-md flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-white text-sm truncate">
              {rx.prescription_type || 'Receita CFM'}
            </h3>
            <StatusBadge status={rx.status} />
            {isSigned && (
              <span className="text-[9px] px-1 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded font-medium">
                ICP
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
            {rx.professional_name && (
              <span className="flex items-center gap-1 truncate">
                <Stethoscope className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {rx.professional_name}
                  {rx.professional_crm && ` · CRM ${rx.professional_crm}`}
                </span>
              </span>
            )}
          </div>

          {medName && (
            <div className="flex items-center gap-2 text-xs text-slate-300 mt-1 flex-wrap">
              <span className="text-slate-500">Medicação:</span>
              <span className="font-medium truncate">{medName}</span>
              {firstMed?.dosage && <span className="text-slate-500">· {firstMed.dosage}</span>}
              {meds.length > 1 && (
                <span className="text-amber-300/70">+{meds.length - 1}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {rx.expires_at && (
            <span className="text-[10px] text-amber-300/70 whitespace-nowrap">
              Val. {formatDate(rx.expires_at)}
            </span>
          )}
          {rx.iti_validation_url && (
            <a
              href={rx.iti_validation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-0.5 transition-colors whitespace-nowrap"
            >
              ITI <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function PatientPrescriptionCard({ rx, professionalName }: { rx: PatientPrescription; professionalName?: string }) {
  return (
    <div className="bg-slate-900/40 border border-blue-500/20 rounded-xl px-3 py-2.5 hover:border-blue-500/40 transition-all">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-500/15 rounded-md flex-shrink-0">
          <Pill className="w-3.5 h-3.5 text-blue-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-white text-sm truncate">
              {rx.title || 'Plano Terapêutico'}
            </h3>
            <StatusBadge status={rx.status} />
            {rx.rationality && (
              <span className="text-[9px] px-1 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded font-medium uppercase">
                {rx.rationality}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
            {professionalName && (
              <span className="flex items-center gap-1 truncate">
                <Stethoscope className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{professionalName}</span>
              </span>
            )}
            {rx.dosage && <span className="text-slate-500">· {rx.dosage}</span>}
            {rx.frequency && <span className="text-slate-500">· {rx.frequency}</span>}
          </div>

          {rx.summary && (
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">{rx.summary}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {rx.starts_at && (
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {formatDate(rx.starts_at)}
            </span>
          )}
          {rx.ends_at && (
            <span className="text-[10px] text-amber-300/70 whitespace-nowrap">
              até {formatDate(rx.ends_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  total: number
}

function Pagination({ currentPage, totalPages, onPageChange, total }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between mt-2 px-1">
      <span className="text-[10px] text-slate-500">
        Página {currentPage} de {totalPages} · {total} item(ns)
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Página anterior"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Próxima página"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
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
  const [cfmPage, setCfmPage] = useState(1)
  const [planPage, setPlanPage] = useState(1)

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
      setCfmPage(1)
      setPlanPage(1)
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

  const cfmTotalPages = Math.max(1, Math.ceil(totalCfm / PAGE_SIZE))
  const planTotalPages = Math.max(1, Math.ceil(totalPlan / PAGE_SIZE))

  const cfmPaged = useMemo(
    () => cfmList.slice((cfmPage - 1) * PAGE_SIZE, cfmPage * PAGE_SIZE),
    [cfmList, cfmPage]
  )
  const planPaged = useMemo(
    () => planList.slice((planPage - 1) * PAGE_SIZE, planPage * PAGE_SIZE),
    [planList, planPage]
  )

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
    <div className={`space-y-5 ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/15 rounded-lg border border-amber-500/30">
            <Pill className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Minhas Prescrições</h2>
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
              className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-xs text-slate-300"
            >
              Voltar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-rose-200 font-medium">Erro ao carregar</p>
            <p className="text-xs text-rose-300/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {total === 0 && !error && (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Nenhuma prescrição ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Quando seu médico emitir prescrições, elas aparecerão aqui automaticamente.
          </p>
        </div>
      )}

      {totalCfm > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <h3 className="text-xs font-semibold text-amber-200 uppercase tracking-wide">
              Receitas Oficiais (CFM)
            </h3>
            <span className="text-[10px] text-slate-500">· {totalCfm}</span>
          </div>
          <div className="grid gap-2">
            {cfmPaged.map(rx => (
              <CfmPrescriptionCard key={rx.id} rx={rx} />
            ))}
          </div>
          <Pagination
            currentPage={cfmPage}
            totalPages={cfmTotalPages}
            onPageChange={setCfmPage}
            total={totalCfm}
          />
        </div>
      )}

      {totalPlan > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Pill className="w-3.5 h-3.5 text-blue-300" />
            <h3 className="text-xs font-semibold text-blue-200 uppercase tracking-wide">
              Plano Terapêutico Integrado
            </h3>
            <span className="text-[10px] text-slate-500">· {totalPlan}</span>
          </div>
          <div className="grid gap-2">
            {planPaged.map(rx => (
              <PatientPrescriptionCard
                key={rx.id}
                rx={rx}
                professionalName={rx.professional_id ? professionals[rx.professional_id] : undefined}
              />
            ))}
          </div>
          <Pagination
            currentPage={planPage}
            totalPages={planTotalPages}
            onPageChange={setPlanPage}
            total={totalPlan}
          />
        </div>
      )}
    </div>
  )
}

export default PatientPrescriptions
