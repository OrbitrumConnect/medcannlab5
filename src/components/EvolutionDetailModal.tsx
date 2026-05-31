/**
 * EvolutionDetailModal — modal pra ver evolução individual em detalhe sem sair
 * do contexto do paciente.
 *
 * V1.9.498 (Pedro 29/05 — pedido empírico Ricardo): clicar em qualquer card
 * da aba Evolução abre relatório completo em modal, não-disruptivo, leitura
 * rápida pré-decisão clínica.
 *
 * Comportamento por kind:
 *  - aec-report (clinical_reports): RichClinicalReportView SOBERANO V1.9.86+
 *    (visualização imutável do AEC com Pipeline Master v2 nested), com
 *    metadata (data, status, assinatura ICP, profissional)
 *  - doctor-evolution (FOLLOW_UP em clinical_assessments): rich do report
 *    associado se existir, senão clinical_report raw + data jsonb
 *  - chat-ia (chat_interaction em patient_medical_records): conteúdo plain
 *    text + record_data jsonb
 *  - assessment-other: clinical_assessments raw content
 *
 * Reusa RichClinicalReportView (princípio polir-não-inventar — única fonte
 * visual da verdade pra relatório AEC).
 *
 * Actions:
 *  - Fechar (X + ESC + click fora)
 *  - Imprimir/Salvar como PDF (window.print scoped no modal — Triple-A escalável
 *    zero deps, mesma stack Prescriptions.tsx V1.9.192)
 */
import React, { useEffect, useState } from 'react'
import { X, Printer, Stethoscope, GitBranch, MessageCircle, Sparkles, Loader2, AlertCircle, FileText, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import RichClinicalReportView from './RichClinicalReportView'

type EvolutionKind = 'doctor-evolution' | 'aec-report' | 'assessment-other' | 'chat-ia'

interface EvolutionLite {
  id: string
  date: string
  time: string
  type: 'current' | 'historical'
  content: string
  professional: string
  source?: 'assessment' | 'report' | 'record' | string
  kind?: EvolutionKind
  signed?: boolean
  // V1.9.535 — quando preenchido, chat-ia card representa N turnos do mesmo dia.
  // Modal busca todos em batch + renderiza timeline detalhada.
  chatGroupIds?: string[]
  chatGroupCount?: number
  chatGroupFirstTime?: string
  chatGroupLastTime?: string
}

interface Props {
  isOpen: boolean
  evolution: EvolutionLite | null
  patientName?: string | null
  onClose: () => void
}

interface FullReport {
  id: string
  content: any
  generated_at: string
  status: string
  signed_at: string | null
  signature_hash: string | null
  professional_name: string | null
}

interface FullAssessment {
  id: string
  created_at: string
  status: string
  assessment_type: string | null
  clinical_report: string | null
  data: any
  doctor_id: string | null
}

interface FullRecord {
  id: string
  created_at: string
  record_type: string | null
  record_data: any
}

// V1.9.535 — array de turnos quando chat-ia é grupo do dia
interface ChatTurn {
  id: string
  created_at: string
  record_data: any
}

const KIND_META: Record<EvolutionKind, { label: string; icon: any; colorClass: string; bgClass: string; borderClass: string }> = {
  'aec-report': {
    label: 'Relatório AEC (IA Residente)',
    icon: FileText,
    colorClass: 'text-emerald-300',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
  },
  'doctor-evolution': {
    label: 'Evolução escrita pelo médico',
    icon: Stethoscope,
    colorClass: 'text-blue-300',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
  },
  'chat-ia': {
    label: 'Conversa com a Nôa',
    icon: MessageCircle,
    colorClass: 'text-slate-300',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/30',
  },
  'assessment-other': {
    label: 'Avaliação clínica',
    icon: Sparkles,
    colorClass: 'text-amber-300',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
  },
}

export const EvolutionDetailModal: React.FC<Props> = ({ isOpen, evolution, patientName, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fullReport, setFullReport] = useState<FullReport | null>(null)
  const [fullAssessment, setFullAssessment] = useState<FullAssessment | null>(null)
  const [fullRecord, setFullRecord] = useState<FullRecord | null>(null)
  const [chatTurns, setChatTurns] = useState<ChatTurn[] | null>(null)  // V1.9.535

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Fetch full content on open
  useEffect(() => {
    if (!isOpen || !evolution) {
      setFullReport(null)
      setFullAssessment(null)
      setFullRecord(null)
      setChatTurns(null)
      setError(null)
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        if (evolution.kind === 'aec-report' || evolution.source === 'report') {
          // V1.9.500-A (29/05 hotfix): assessment + plan vivem dentro de content jsonb,
          // NÃO são colunas em clinical_reports. Removidos do SELECT (causava
          // "column clinical_reports.assessment does not exist").
          const { data, error: err } = await (supabase as any)
            .from('clinical_reports')
            .select('id, content, generated_at, status, signed_at, signature_hash, professional_name')
            .eq('id', evolution.id)
            .maybeSingle()
          if (err) throw err
          if (!cancelled) setFullReport(data as FullReport | null)
        } else if (evolution.kind === 'doctor-evolution' || evolution.kind === 'assessment-other' || evolution.source === 'assessment') {
          const { data, error: err } = await (supabase as any)
            .from('clinical_assessments')
            .select('id, created_at, status, assessment_type, clinical_report, data, doctor_id')
            .eq('id', evolution.id)
            .maybeSingle()
          if (err) throw err
          if (!cancelled) setFullAssessment(data as FullAssessment | null)
        } else if (evolution.kind === 'chat-ia' || evolution.source === 'record') {
          // V1.9.535 — chat-ia agora vem agrupado por dia. Se chatGroupIds tem N IDs,
          // busca todos os turnos em batch + renderiza como timeline. Senão fallback
          // pra single record antigo.
          if (evolution.chatGroupIds && evolution.chatGroupIds.length > 0) {
            const { data, error: err } = await (supabase as any)
              .from('patient_medical_records')
              .select('id, created_at, record_data')
              .in('id', evolution.chatGroupIds)
              .order('created_at', { ascending: true })
            if (err) throw err
            if (!cancelled) setChatTurns((data as ChatTurn[]) || [])
          } else {
            const { data, error: err } = await (supabase as any)
              .from('patient_medical_records')
              .select('id, created_at, record_type, record_data')
              .eq('id', evolution.id)
              .maybeSingle()
            if (err) throw err
            if (!cancelled) setFullRecord(data as FullRecord | null)
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Erro ao carregar detalhes')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [isOpen, evolution])

  if (!isOpen || !evolution) return null

  const kind = evolution.kind || 'assessment-other'
  const meta = KIND_META[kind]
  const Icon = meta.icon

  const handlePrint = () => {
    window.print()
  }

  // Detecta se a evolution tem conteúdo "rico" pra renderizar via RichClinicalReportView.
  // AEC reports sempre. Para FOLLOW_UP, se data jsonb tem estrutura conhecida (queixa,
  // hda, etc), também tenta.
  const richContent = (() => {
    if (fullReport?.content) return fullReport.content
    if (fullAssessment?.data && typeof fullAssessment.data === 'object') {
      const d = fullAssessment.data
      if (d.queixa_principal || d.chief_complaint || d.chiefComplaint || d.mainComplaint || d.lista_indiciaria) {
        return d
      }
    }
    return null
  })()

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto print:p-0 print:bg-white"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`bg-slate-900 border rounded-xl max-w-4xl w-full my-4 max-h-[92vh] overflow-y-auto print:max-h-none print:my-0 print:bg-white print:border-0 ${meta.borderClass}`}
        id="evolution-detail-modal-content"
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 ${meta.bgClass} border-b ${meta.borderClass} px-4 py-3 print:relative`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className={`p-1.5 rounded-lg ${meta.bgClass} border ${meta.borderClass} flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${meta.colorClass}`} />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white print:text-black">
                  {meta.label}
                </h2>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 print:text-slate-600 mt-0.5 flex-wrap">
                  <span>{evolution.date} · {evolution.time}</span>
                  <span>·</span>
                  <span>{evolution.professional}</span>
                  {patientName && (
                    <>
                      <span>·</span>
                      <span className="text-slate-300 print:text-slate-800">Paciente: {patientName}</span>
                    </>
                  )}
                  {(fullReport?.signed_at || evolution.signed) && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-emerald-300 print:text-emerald-700">
                        <Shield className="w-3 h-3" />
                        Assinado ICP-Brasil
                      </span>
                    </>
                  )}
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] uppercase ${
                    evolution.type === 'current'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}>
                    {evolution.type === 'current' ? 'Atual' : 'Histórico'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded transition-colors"
                title="Imprimir ou salvar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Imprimir / PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 print:p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-amber-300 animate-spin" />
              <span className="ml-2 text-sm text-slate-400">Carregando relatório completo…</span>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">
                <p className="font-semibold">Erro ao carregar detalhes</p>
                <p className="text-xs text-red-300 mt-0.5">{error}</p>
                <p className="text-xs text-slate-400 mt-2">Mostrando preview disponível:</p>
                <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap">{evolution.content}</p>
              </div>
            </div>
          ) : richContent ? (
            // AEC report ou FOLLOW_UP com estrutura rica → renderer SOBERANO V1.9.86+
            <div className="bg-slate-800/30 rounded-lg p-2 print:bg-white print:p-0">
              <RichClinicalReportView
                content={richContent}
                assessment={fullReport?.content?.assessment || fullAssessment?.data?.assessment || undefined}
                plan={fullReport?.content?.plan || fullAssessment?.data?.plan || undefined}
              />
            </div>
          ) : fullAssessment ? (
            // FOLLOW_UP / assessment sem rich content → mostra clinical_report + data
            <div className="space-y-3">
              {fullAssessment.assessment_type && (
                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                  Tipo: <span className="text-slate-300">{fullAssessment.assessment_type}</span>
                  {fullAssessment.status && (
                    <>
                      <span className="mx-2">·</span>
                      Status: <span className="text-slate-300">{fullAssessment.status}</span>
                    </>
                  )}
                </div>
              )}
              {fullAssessment.clinical_report ? (
                <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-white mb-2">Registro clínico</h3>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{fullAssessment.clinical_report}</pre>
                </div>
              ) : null}
              {fullAssessment.data && (
                <details className="bg-slate-800/20 border border-slate-700/50 rounded-lg p-3">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-200">
                    Dados estruturados (avançado)
                  </summary>
                  <pre className="text-[10px] text-slate-500 mt-2 whitespace-pre-wrap font-mono overflow-x-auto">
                    {JSON.stringify(fullAssessment.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ) : chatTurns ? (
            // V1.9.535 — chat-ia AGRUPADO: timeline de N turnos do mesmo dia
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-wide text-slate-500 flex items-center gap-2 flex-wrap">
                <span>{chatTurns.length} mensagens trocadas</span>
                {evolution.chatGroupFirstTime && evolution.chatGroupLastTime && (
                  <>
                    <span>·</span>
                    <span className="text-slate-300">{evolution.chatGroupFirstTime} → {evolution.chatGroupLastTime}</span>
                  </>
                )}
              </div>
              {chatTurns.length === 0 ? (
                <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4 text-center text-sm text-slate-400">
                  Nenhuma mensagem encontrada.
                </div>
              ) : (
                <div className="space-y-2">
                  {chatTurns.map((turn) => {
                    const rd = (turn.record_data || {}) as any
                    const userMsg = typeof rd.user_message === 'string' ? rd.user_message : null
                    const aiResp = typeof rd.ai_response === 'string' ? rd.ai_response : null
                    const time = new Date(turn.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <div key={turn.id} className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3 space-y-2">
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">{time}</div>
                        {userMsg && (
                          <div className="flex gap-2">
                            <span className="text-[10px] text-blue-300 uppercase font-semibold w-16 flex-shrink-0 pt-0.5">Paciente</span>
                            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed flex-1">{userMsg}</p>
                          </div>
                        )}
                        {aiResp && (
                          <div className="flex gap-2">
                            <span className="text-[10px] text-emerald-300 uppercase font-semibold w-16 flex-shrink-0 pt-0.5">Nôa</span>
                            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed flex-1">{aiResp}</p>
                          </div>
                        )}
                        {!userMsg && !aiResp && (
                          <pre className="text-[10px] text-slate-500 whitespace-pre-wrap font-mono overflow-x-auto">
                            {JSON.stringify(rd, null, 2)}
                          </pre>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : fullRecord ? (
            // chat-ia (patient_medical_records) single turn — fallback pré-V1.9.535
            <div className="space-y-3">
              {fullRecord.record_type && (
                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                  Tipo: <span className="text-slate-300">{fullRecord.record_type}</span>
                </div>
              )}
              {fullRecord.record_data && (
                <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3">
                  {typeof fullRecord.record_data === 'string' ? (
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{fullRecord.record_data}</pre>
                  ) : (
                    <pre className="text-[10px] text-slate-400 whitespace-pre-wrap font-mono overflow-x-auto">
                      {JSON.stringify(fullRecord.record_data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Fallback — mostra preview text que vem do card
            <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-300 whitespace-pre-wrap">{evolution.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
