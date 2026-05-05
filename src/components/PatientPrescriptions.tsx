/**
 * V1.9.124-C — Aba Minhas Prescrições paciente — interativa + analytics
 *
 * Lista cfm_prescriptions (oficiais ICP-Brasil) + patient_prescriptions
 * (plano terapêutico). RLS já permite paciente ver suas próprias.
 *
 * V1.9.124-C (pós-feedback Pedro): mini-stats topo + cards clicáveis
 * + modal de detalhes + botão solicitar nova + imprimir + validar ITI.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Pill, FileText, ShieldCheck, ExternalLink, Loader2, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, Stethoscope, Plus, X,
  Calendar, CheckCircle2, Clock, Printer
} from 'lucide-react'
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

function StatusBadge({ status, size = 'sm' }: { status: string | null; size?: 'sm' | 'md' }) {
  const cfg = (status && STATUS_LABELS[status.toLowerCase()]) || { label: status || 'Pendente', color: 'slate' }
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    slate:   'bg-slate-500/15 text-slate-300 border-slate-500/30',
    blue:    'bg-blue-500/15 text-blue-300 border-blue-500/30',
    amber:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose:    'bg-rose-500/15 text-rose-300 border-rose-500/30',
  }
  const sizeCls = size === 'md'
    ? 'px-2 py-0.5 text-xs'
    : 'px-1.5 py-0.5 text-[10px]'
  return (
    <span className={`${sizeCls} rounded font-medium border ${colorMap[cfg.color]}`}>
      {cfg.label}
    </span>
  )
}

function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: 'amber' | 'emerald' | 'blue' | 'slate' }) {
  const colorCls = {
    amber:   'border-amber-500/30 bg-amber-500/5 text-amber-300',
    emerald: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300',
    blue:    'border-blue-500/30 bg-blue-500/5 text-blue-300',
    slate:   'border-slate-500/30 bg-slate-500/5 text-slate-300',
  }[color]
  return (
    <div className={`border rounded-lg px-3 py-2 ${colorCls}`}>
      <div className="flex items-center gap-1.5 mb-0.5">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] uppercase tracking-wide opacity-80">{label}</span>
      </div>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  )
}

function CfmPrescriptionCard({ rx, onClick }: { rx: CfmPrescription; onClick: () => void }) {
  const meds = Array.isArray(rx.medications) ? rx.medications : []
  const firstMed = meds[0]
  const isSigned = !!rx.signature_timestamp
  const medName = firstMed?.name || firstMed?.medication || (firstMed ? JSON.stringify(firstMed).slice(0, 50) : null)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-900/40 border border-amber-500/20 rounded-xl px-3 py-2.5 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer"
    >
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

        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {rx.expires_at && (
            <span className="text-[10px] text-amber-300/70 whitespace-nowrap">
              Val. {formatDate(rx.expires_at)}
            </span>
          )}
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            ver detalhes <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </button>
  )
}

function PatientPrescriptionCard({ rx, professionalName, onClick }: { rx: PatientPrescription; professionalName?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-900/40 border border-blue-500/20 rounded-xl px-3 py-2.5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer"
    >
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

        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {rx.starts_at && (
            <span className="text-[10px] text-slate-400 whitespace-nowrap">
              {formatDate(rx.starts_at)}
            </span>
          )}
          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
            ver detalhes <ChevronRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </button>
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

function CfmDetailModal({ rx, onClose }: { rx: CfmPrescription; onClose: () => void }) {
  const meds = Array.isArray(rx.medications) ? rx.medications : []
  const isSigned = !!rx.signature_timestamp
  const isExpired = rx.expires_at ? new Date(rx.expires_at) < new Date() : false
  // [V1.9.137] Receita SÓ tem valor legal CFM se status=signed/sent/validated + ITI presente (qr ou url)
  const hasLegalValue =
    (rx.status === 'signed' || rx.status === 'sent' || rx.status === 'validated') &&
    (!!rx.iti_qr_code || !!rx.iti_validation_url)

  const handlePrint = () => {
    if (!hasLegalValue) {
      const ok = window.confirm(
        '⚠️ ATENÇÃO\n\nEsta receita está em RASCUNHO (sem assinatura digital ICP-Brasil).\n\n' +
        'Farmácias NÃO aceitam receitas em rascunho — não terá valor legal CFM 2.314/2022.\n\n' +
        'Imprimir somente para arquivo pessoal/conferência?'
      )
      if (!ok) return
    }
    window.print()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-amber-500/20 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/15 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{rx.prescription_type || 'Receita CFM'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={rx.status} size="md" />
                {isSigned && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded font-medium">
                    ICP-Brasil
                  </span>
                )}
                {isExpired && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-rose-500/15 text-rose-300 border border-rose-500/30 rounded font-medium">
                    EXPIRADA
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* [V1.9.137] Banner aviso quando rascunho/sem valor legal */}
        {!hasLegalValue && (
          <div className="mx-5 mt-5 rounded-lg border border-yellow-500/40 bg-yellow-500/[0.08] p-3 flex items-start gap-3 print:hidden">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="text-yellow-200 font-semibold mb-1">Receita em rascunho — sem valor legal</p>
              <p className="text-slate-300 leading-relaxed">
                Esta receita ainda não foi assinada digitalmente com certificado ICP-Brasil.
                <strong className="text-white"> Farmácias não aceitam rascunhos</strong> — aguarde o médico concluir a assinatura
                para uso oficial (CFM 2.314/2022).
              </p>
            </div>
          </div>
        )}

        {/* [V1.9.137] Marca d'água "RASCUNHO" visível na impressão se sem valor legal */}
        {!hasLegalValue && (
          <style>{`
            @media print {
              body::before {
                content: "RASCUNHO — SEM VALOR LEGAL CFM";
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-30deg);
                font-size: 80px;
                color: rgba(220, 38, 38, 0.18);
                font-weight: 900;
                z-index: 9999;
                pointer-events: none;
                white-space: nowrap;
                letter-spacing: 4px;
              }
            }
          `}</style>
        )}

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/40 rounded-lg p-3 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Médico</p>
              <p className="text-sm text-white font-medium">{rx.professional_name || '—'}</p>
              {rx.professional_crm && <p className="text-xs text-slate-400">CRM {rx.professional_crm}</p>}
              {rx.professional_specialty && <p className="text-xs text-slate-400">{rx.professional_specialty}</p>}
            </div>
            <div className="bg-slate-950/40 rounded-lg p-3 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase mb-1">Datas</p>
              {rx.signature_timestamp && (
                <p className="text-xs text-slate-300">
                  <span className="text-slate-500">Emitida:</span> {formatDate(rx.signature_timestamp)}
                </p>
              )}
              {rx.expires_at && (
                <p className={`text-xs ${isExpired ? 'text-rose-300' : 'text-amber-300'}`}>
                  <span className="text-slate-500">Validade:</span> {formatDate(rx.expires_at)}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase mb-2">
              Medicações ({meds.length})
            </p>
            {meds.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Nenhuma medicação registrada</p>
            ) : (
              <div className="space-y-2">
                {meds.map((med: any, idx: number) => (
                  <div key={idx} className="bg-slate-950/40 rounded-lg p-3 border border-white/5">
                    <p className="text-sm text-white font-medium">
                      {med.name || med.medication || `Medicação ${idx + 1}`}
                    </p>
                    {med.dosage && <p className="text-xs text-slate-400 mt-0.5">Dosagem: {med.dosage}</p>}
                    {med.frequency && <p className="text-xs text-slate-400">Frequência: {med.frequency}</p>}
                    {med.duration && <p className="text-xs text-slate-400">Duração: {med.duration}</p>}
                    {med.instructions && <p className="text-xs text-slate-300 mt-1 italic">"{med.instructions}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {rx.notes && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-2">Observações</p>
              <div className="bg-slate-950/40 rounded-lg p-3 border border-white/5">
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{rx.notes}</p>
              </div>
            </div>
          )}

          {rx.iti_qr_code && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-2">QR Code ITI (ICP-Brasil)</p>
              <div className="bg-white rounded-lg p-3 inline-block">
                <img src={rx.iti_qr_code} alt="QR Code ITI" className="w-32 h-32" />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-amber-500/20 px-5 py-3 flex items-center justify-end gap-2 flex-wrap">
          {rx.iti_validation_url && (
            <a
              href={rx.iti_validation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs rounded-lg transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3 h-3" /> Validar no ITI
            </a>
          )}
          {/* [V1.9.137] Botão Imprimir com texto contextual + warn em rascunho */}
          <button
            onClick={handlePrint}
            title={hasLegalValue ? 'Imprimir receita oficial (válida em farmácia)' : 'Imprimir como rascunho (sem valor legal)'}
            className={`px-3 py-1.5 border text-xs rounded-lg transition-all flex items-center gap-1.5 ${
              hasLegalValue
                ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-200'
                : 'bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-200'
            }`}
          >
            <Printer className="w-3 h-3" />
            {hasLegalValue ? 'Imprimir receita' : 'Imprimir rascunho'}
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-amber-500/30 hover:bg-amber-500/50 border border-amber-400/40 text-amber-100 text-xs rounded-lg transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function PlanDetailModal({ rx, professionalName, onClose }: { rx: PatientPrescription; professionalName?: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-blue-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-slate-900 border-b border-blue-500/20 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/15 rounded-lg">
              <Pill className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{rx.title || 'Plano Terapêutico'}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={rx.status} size="md" />
                {rx.rationality && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded font-medium uppercase">
                    {rx.rationality}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {(professionalName || rx.starts_at || rx.ends_at) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {professionalName && (
                <div className="bg-slate-950/40 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Médico</p>
                  <p className="text-sm text-white font-medium">{professionalName}</p>
                </div>
              )}
              {(rx.starts_at || rx.ends_at) && (
                <div className="bg-slate-950/40 rounded-lg p-3 border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase mb-1">Período</p>
                  {rx.starts_at && <p className="text-xs text-slate-300"><span className="text-slate-500">Início:</span> {formatDate(rx.starts_at)}</p>}
                  {rx.ends_at && <p className="text-xs text-slate-300"><span className="text-slate-500">Fim:</span> {formatDate(rx.ends_at)}</p>}
                </div>
              )}
            </div>
          )}

          {rx.summary && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-2">Resumo</p>
              <p className="text-sm text-slate-300">{rx.summary}</p>
            </div>
          )}

          {(rx.dosage || rx.frequency || rx.duration) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
            <div>
              <p className="text-[10px] text-slate-500 uppercase mb-2">Instruções</p>
              <div className="bg-slate-950/40 rounded-lg p-3 border border-white/5">
                <p className="text-xs text-slate-300 whitespace-pre-wrap">{rx.instructions}</p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-blue-500/20 px-5 py-3 flex items-center justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            <Printer className="w-3 h-3" /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/40 text-blue-100 text-xs rounded-lg transition-all"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

interface Props {
  className?: string
  onBack?: () => void
  onRequestNew?: () => void
}

export function PatientPrescriptions({ className = '', onBack, onRequestNew }: Props) {
  const { user } = useAuth()
  const [cfmList, setCfmList] = useState<CfmPrescription[]>([])
  const [planList, setPlanList] = useState<PatientPrescription[]>([])
  const [professionals, setProfessionals] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cfmPage, setCfmPage] = useState(1)
  const [planPage, setPlanPage] = useState(1)
  const [selectedCfm, setSelectedCfm] = useState<CfmPrescription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PatientPrescription | null>(null)

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

  const stats = useMemo(() => {
    const all = [...cfmList, ...planList]
    const total = all.length
    const ativas = cfmList.filter(rx => {
      const expired = rx.expires_at ? new Date(rx.expires_at) < new Date() : false
      return !expired && rx.status !== 'cancelled' && rx.status !== 'expired'
    }).length + planList.filter(rx => rx.status === 'active').length
    const enviadas = cfmList.filter(rx => rx.status === 'sent' || rx.status === 'signed').length
    const ultimaCfm = cfmList[0]
    const ultimaPlan = planList[0]
    let ultima: { date: string | null; medico: string | null } = { date: null, medico: null }
    if (ultimaCfm && (!ultimaPlan || (ultimaCfm.created_at >= (ultimaPlan.issued_at || '')))) {
      ultima = { date: ultimaCfm.created_at, medico: ultimaCfm.professional_name }
    } else if (ultimaPlan) {
      ultima = {
        date: ultimaPlan.issued_at,
        medico: ultimaPlan.professional_id ? (professionals[ultimaPlan.professional_id] || null) : null
      }
    }
    return { total, ativas, enviadas, ultima }
  }, [cfmList, planList, professionals])

  const totalCfm = cfmList.length
  const totalPlan = planList.length

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
              {stats.total === 0 ? 'Nenhuma prescrição registrada ainda' : `${stats.total} prescrição(ões) registrada(s)`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRequestNew && (
            <button
              onClick={onRequestNew}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs rounded-lg transition-all flex items-center gap-1.5"
              title="Solicitar nova receita ao seu médico"
            >
              <Plus className="w-3.5 h-3.5" /> Solicitar receita
            </button>
          )}
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

      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatBox icon={FileText} label="Total" value={stats.total} color="slate" />
          <StatBox icon={CheckCircle2} label="Ativas" value={stats.ativas} color="emerald" />
          <StatBox icon={ShieldCheck} label="Enviadas/ICP" value={stats.enviadas} color="amber" />
          <StatBox
            icon={Clock}
            label="Última"
            value={stats.ultima.date ? formatDate(stats.ultima.date) : '—'}
            color="blue"
          />
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-rose-200 font-medium">Erro ao carregar</p>
            <p className="text-xs text-rose-300/70 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {stats.total === 0 && !error && (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl p-8 text-center">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Nenhuma prescrição ainda</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            Quando seu médico emitir prescrições, elas aparecerão aqui automaticamente.
          </p>
          {onRequestNew && (
            <button
              onClick={onRequestNew}
              className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-sm rounded-lg transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Solicitar receita ao médico
            </button>
          )}
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
              <CfmPrescriptionCard key={rx.id} rx={rx} onClick={() => setSelectedCfm(rx)} />
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
                onClick={() => setSelectedPlan(rx)}
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

      {selectedCfm && <CfmDetailModal rx={selectedCfm} onClose={() => setSelectedCfm(null)} />}
      {selectedPlan && (
        <PlanDetailModal
          rx={selectedPlan}
          professionalName={selectedPlan.professional_id ? professionals[selectedPlan.professional_id] : undefined}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </div>
  )
}

export default PatientPrescriptions
