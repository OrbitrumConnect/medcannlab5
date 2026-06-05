/**
 * ImportClinicalBaseWizard — Wizard de Migração de Base Clínica (Fase 3, V1.9.589).
 *
 * Frontend do fluxo "tenho meus pacientes em outro EMR e quero migrar sem cadastrar 1 a 1".
 * Parseia CSVs do export (motor PURO em src/lib/import), mostra preview, coleta o aceite do
 * Termo de Responsabilidade, cria o import_batch e POSTa em CHUNKS pra Edge `bulk-import-emr`
 * (que cria auth.users via service role — privilégio que NÃO pode ficar no frontend).
 *
 * v1 = upload MULTI-CSV (patients obrigatório; notes/prescriptions/exams/files opcionais).
 * ZIP fica pra v2 (exige lib de unzip; multi-CSV cobre o caso sem dependência nova).
 *
 * ISOLADO: não toca tradevision-core nem locks. Nada acontece até o profissional subir CSV +
 * aceitar o termo + clicar Importar. Ver docs/MIGRACAO_BASE_CLINICA_SPEC.md.
 */
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Upload, FileText, ShieldCheck, ListChecks, Database, Loader2, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { emrExportFromCsvTexts } from '../../lib/import/csvParse'
import { mapEmrExport } from '../../lib/import/emrMapper'
import type { MappedImport } from '../../lib/import/emrTypes'

// Termo aceito por lote (evidência operacional — ver spec §7). Mudou o texto → bump a versão.
const TERMS_VERSION = '2026-06-04.v1'
const TERMS_TEXT = `Termo de Responsabilidade pela Importação de Dados

Ao realizar a importação de dados para a plataforma MedCannLab, o profissional declara que:

1. É o legítimo responsável pelos dados importados ou possui autorização legal para seu tratamento.
2. Possui base legal para a coleta, armazenamento, utilização e transferência dos dados para a plataforma, nos termos da legislação aplicável, incluindo a Lei Geral de Proteção de Dados Pessoais (LGPD).
3. Os dados importados referem-se a pacientes sob sua responsabilidade profissional e serão utilizados exclusivamente para finalidades assistenciais, administrativas ou regulatórias relacionadas ao atendimento prestado.
4. Assegura que a importação não viola obrigações de confidencialidade, sigilo profissional, contratos com terceiros ou determinações legais.
5. Reconhece que a MedCannLab atua como plataforma tecnológica (operadora) para armazenamento e processamento das informações, comprometendo-se a utilizar os recursos de forma compatível com a legislação vigente.
6. Responsabiliza-se pela exatidão, origem e legitimidade dos dados importados.
7. Declara ter cumprido o dever de informação aos pacientes conforme o consentimento original obtido, e reconhece que os titulares mantêm seus direitos de acesso, correção, portabilidade e exclusão (LGPD Art. 18) na plataforma.
8. Concorda que a plataforma registre evidências da operação de importação, incluindo data, hora, usuário responsável, quantidade de registros importados e versão deste termo.`

const CHUNK_SIZE = 50 // pacientes por chamada da Edge (cada chunk leva os filhos dos seus pacientes)

interface Props {
  open: boolean
  onClose: () => void
  professionalId: string
}

type Slot = 'patients' | 'notes' | 'prescriptions' | 'exams' | 'files'
const SLOTS: { key: Slot; label: string; required?: boolean }[] = [
  { key: 'patients', label: 'Pacientes (obrigatório)', required: true },
  { key: 'notes', label: 'Evoluções / Notas' },
  { key: 'prescriptions', label: 'Prescrições' },
  { key: 'exams', label: 'Exames' },
  { key: 'files', label: 'Documentos (índice)' },
]

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export default function ImportClinicalBaseWizard({ open, onClose, professionalId }: Props) {
  const toast = useToast()
  const [step, setStep] = useState(1)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [csvTexts, setCsvTexts] = useState<Partial<Record<Slot, string>>>({})
  const [fileNames, setFileNames] = useState<Partial<Record<Slot, string>>>({})
  const [mapped, setMapped] = useState<MappedImport | null>(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [result, setResult] = useState<null | {
    created: number; merged: number; records: number; prescriptions: number; exams: number; documents: number; errors: number
  }>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canAnalyze = !!csvTexts.patients
  const summary = mapped?.summary

  const reset = () => {
    setStep(1); setTermsAccepted(false); setCsvTexts({}); setFileNames({})
    setMapped(null); setRunning(false); setProgress({ done: 0, total: 0 }); setResult(null); setErrorMsg(null)
  }
  const close = () => { if (!running) { reset(); onClose() } }

  const onPickFile = async (slot: Slot, file: File | null) => {
    if (!file) return
    const text = await file.text()
    setCsvTexts((p) => ({ ...p, [slot]: text }))
    setFileNames((p) => ({ ...p, [slot]: file.name }))
    setMapped(null) // invalida análise anterior
  }

  const analyze = () => {
    try {
      const exp = emrExportFromCsvTexts({
        patients: csvTexts.patients || '',
        notes: csvTexts.notes, prescriptions: csvTexts.prescriptions, exams: csvTexts.exams, files: csvTexts.files,
      })
      const m = mapEmrExport(exp)
      setMapped(m)
      setStep(3)
    } catch (e) {
      toast.error('Falha ao analisar', (e as Error)?.message || 'Verifique se os arquivos são CSV válidos.')
    }
  }

  const runImport = async () => {
    if (!mapped) return
    setRunning(true); setErrorMsg(null)
    try {
      // 1. cria o lote com o aceite do termo gravado (auditoria)
      const termsHash = await sha256(TERMS_TEXT)
      const { data: batch, error: bErr } = await (supabase as any)
        .from('import_batches')
        .insert({
          professional_id: professionalId,
          source_system: 'csv_custom',
          filename: fileNames.patients || null,
          status: 'importing',
          total_patients: mapped.patients.length,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          terms_version: TERMS_VERSION,
          terms_hash: termsHash,
          accepted_user_agent: navigator.userAgent,
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (bErr || !batch) throw new Error(bErr?.message || 'não foi possível criar o lote')
      const batchId = (batch as { id: string }).id

      // 2. chunks SEQUENCIAIS (cada chunk leva os filhos dos seus pacientes; sem race no progresso)
      const groups = chunk(mapped.patients, CHUNK_SIZE)
      setProgress({ done: 0, total: groups.length })
      const acc = { created: 0, merged: 0, records: 0, prescriptions: 0, exams: 0, documents: 0, errors: 0 }

      for (let i = 0; i < groups.length; i++) {
        const patients = groups[i]
        const ids = new Set(patients.map((p) => p.source_external_id))
        const inChunk = <T extends { source_patient_id: string | null }>(arr: T[]) =>
          arr.filter((r) => r.source_patient_id != null && ids.has(r.source_patient_id))

        const body = {
          import_batch_id: batchId,
          patients: patients.map((p) => ({
            source_external_id: p.source_external_id, name: p.name, email: p.email, cpf: p.cpf,
            birth_date: p.birth_date, gender: p.gender, phone: p.phone, address: p.address, blood_type: p.blood_type,
          })),
          records: inChunk(mapped.records).map((r) => ({ source_patient_id: r.source_patient_id, source_external_id: r.source_external_id, record_data: r.record_data })),
          prescriptions: inChunk(mapped.prescriptions).map((r) => ({ source_patient_id: r.source_patient_id, source_external_id: r.source_external_id, content: r.content, status: r.status })),
          exams: inChunk(mapped.exams).map((r) => ({ source_patient_id: r.source_patient_id, source_external_id: r.source_external_id, description: r.description, status: r.status })),
          documents: inChunk(mapped.files).map((f) => ({ source_patient_id: f.source_patient_id, source_external_id: f.source_external_id, name: f.name, path: f.path })),
        }

        const { data, error } = await supabase.functions.invoke('bulk-import-emr', { body })
        if (error) throw new Error(`chunk ${i + 1}/${groups.length}: ${error.message}`)
        const c = (data as { chunk?: typeof acc })?.chunk
        if (c) {
          acc.created += c.created; acc.merged += c.merged; acc.records += c.records
          acc.prescriptions += c.prescriptions; acc.exams += c.exams; acc.documents += c.documents; acc.errors += c.errors
        }
        setProgress({ done: i + 1, total: groups.length })
      }

      // 3. fecha o lote
      await (supabase as any).from('import_batches').update({ status: acc.errors > 0 ? 'partial' : 'done', finished_at: new Date().toISOString() }).eq('id', batchId)

      setResult(acc)
      setStep(7)
      toast.success('Importação concluída', `${acc.created} criados · ${acc.merged} já existiam${acc.errors ? ` · ${acc.errors} erro(s)` : ''}`)
    } catch (e) {
      const msg = (e as Error)?.message || 'erro desconhecido'
      setErrorMsg(msg)
      toast.error('Falha na importação', msg)
    } finally {
      setRunning(false)
    }
  }

  const stepMeta = useMemo(() => [
    { n: 1, label: 'Termo', icon: ShieldCheck },
    { n: 2, label: 'Arquivos', icon: Upload },
    { n: 3, label: 'Análise', icon: ListChecks },
    { n: 4, label: 'Mapeamento', icon: FileText },
    { n: 5, label: 'Revisão', icon: ListChecks },
    { n: 6, label: 'Importar', icon: Database },
  ], [])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/70 p-4" onClick={close}>
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-semibold">Migração de Base Clínica</h2>
          </div>
          <button onClick={close} disabled={running} className="text-slate-400 hover:text-white disabled:opacity-40">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        {step <= 6 && (
          <div className="flex items-center gap-1 px-5 py-3 border-b border-slate-800 overflow-x-auto">
            {stepMeta.map((s, i) => {
              const Icon = s.icon
              const active = step === s.n
              const done = step > s.n
              return (
                <div key={s.n} className="flex items-center gap-1 shrink-0">
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${active ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : done ? 'text-emerald-400/70' : 'text-slate-500'}`}>
                    <Icon className="w-3.5 h-3.5" /> {s.label}
                  </div>
                  {i < stepMeta.length - 1 && <div className="w-3 h-px bg-slate-700" />}
                </div>
              )
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 text-sm text-slate-200">
          {/* STEP 1 — TERMO */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-slate-400">Antes de importar, leia e aceite o termo. Ele é gravado por lote (versão + data + hash) como evidência.</p>
              <pre className="whitespace-pre-wrap bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-xs text-slate-300 max-h-72 overflow-y-auto font-sans">{TERMS_TEXT}</pre>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                <span>Li e concordo com os termos acima.</span>
              </label>
            </div>
          )}

          {/* STEP 2 — UPLOAD */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-slate-400">Envie os CSVs do export do seu sistema. Só <strong>Pacientes</strong> é obrigatório.</p>
              {SLOTS.map((slot) => (
                <div key={slot.key} className="flex items-center justify-between gap-3 bg-slate-800/40 border border-slate-700 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-4 h-4 shrink-0 ${csvTexts[slot.key] ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span className="truncate">{slot.label}</span>
                    {fileNames[slot.key] && <span className="text-xs text-emerald-400/80 truncate">· {fileNames[slot.key]}</span>}
                  </div>
                  <label className="shrink-0 cursor-pointer text-xs px-2.5 py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-white">
                    {csvTexts[slot.key] ? 'Trocar' : 'Escolher'}
                    <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onPickFile(slot.key, e.target.files?.[0] ?? null)} />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3 — ANÁLISE */}
          {step === 3 && summary && (
            <div className="space-y-4">
              <p className="text-slate-400">Lemos os arquivos (nada foi gravado). Contagens encontradas:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  ['Pacientes', summary.patients], ['Evoluções', summary.notes], ['Prescrições', summary.prescriptions],
                  ['Exames', summary.exams], ['Documentos', summary.files],
                ].map(([label, n]) => (
                  <div key={label as string} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                    <div className="text-2xl font-bold text-emerald-300">{n as number}</div>
                    <div className="text-xs text-slate-400">{label as string}</div>
                  </div>
                ))}
              </div>
              {mapped!.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-200 text-xs space-y-1">
                  {mapped!.warnings.map((w, i) => (<div key={i} className="flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{w}</div>))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — MAPEAMENTO */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-slate-400">Como cada tabela de origem vira dado na MedCannLab:</p>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                {[
                  ['Pacientes', 'Pacientes (perfil + vínculo com você)'],
                  ['Evoluções / Notas', 'Prontuário · evoluções (histórico)'],
                  ['Prescrições', 'Prontuário · histórico de prescrição'],
                  ['Exames', 'Prontuário · histórico de exames'],
                  ['Documentos', 'Documentos do paciente (índice)'],
                ].map(([from, to], i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 text-xs ${i % 2 ? 'bg-slate-800/30' : ''}`}>
                    <span className="text-slate-300 w-40 shrink-0">{from}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-emerald-300/90">{to}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">Dados importados ficam marcados como tal (proveniência) e <strong>não</strong> alimentam a IA nem inflam métricas públicas.</p>
            </div>
          )}

          {/* STEP 5 — REVISÃO */}
          {step === 5 && summary && (
            <div className="space-y-3">
              <p className="text-slate-400">Resumo do que será enviado. A deduplicação contra a base existente (por CPF → e-mail) acontece no servidor — pacientes já cadastrados são <strong>reaproveitados</strong>, não duplicados.</p>
              <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 text-sm">
                <strong className="text-emerald-300">{summary.patients}</strong> paciente(s) · <strong className="text-emerald-300">{summary.notes}</strong> evolução(ões) · <strong className="text-emerald-300">{summary.prescriptions}</strong> prescrição(ões) · <strong className="text-emerald-300">{summary.exams}</strong> exame(s) · <strong className="text-emerald-300">{summary.files}</strong> documento(s)
              </div>
              <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-3 text-xs text-slate-400">
                Será criado 1 lote de importação ({Math.ceil(summary.patients / CHUNK_SIZE)} envio(s) de até {CHUNK_SIZE} pacientes). Re-rodar o mesmo arquivo não duplica (idempotência por origem).
              </div>
            </div>
          )}

          {/* STEP 6 — IMPORTAR */}
          {step === 6 && summary && (
            <div className="space-y-4">
              {!running && !errorMsg && (
                <p className="text-slate-300">Tudo pronto. Ao confirmar, criamos os pacientes (perfil + prontuário) e vinculamos a você. Isso cria identidades reais — confirme que os dados estão certos.</p>
              )}
              {running && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300"><Loader2 className="w-4 h-4 animate-spin" /> Importando… lote {progress.done}/{progress.total}</div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
                  </div>
                </div>
              )}
              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-200 text-xs flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* STEP 7 — RESULTADO */}
          {step === 7 && result && (
            <div className="space-y-4 text-center py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Importação concluída</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left">
                {[
                  ['Pacientes criados', result.created], ['Já existiam (mesclados)', result.merged], ['Evoluções', result.records],
                  ['Prescrições', result.prescriptions], ['Exames', result.exams], ['Documentos', result.documents],
                ].map(([label, n]) => (
                  <div key={label as string} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                    <div className="text-xl font-bold text-emerald-300">{n as number}</div>
                    <div className="text-xs text-slate-400">{label as string}</div>
                  </div>
                ))}
              </div>
              {result.errors > 0 && <p className="text-amber-300 text-xs">{result.errors} registro(s) com erro — veja o log do lote.</p>}
            </div>
          )}
        </div>

        {/* Footer / nav */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-700">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={running || step === 1 || step === 7}
            className="px-3 py-1.5 rounded-md text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            Voltar
          </button>

          {step === 7 ? (
            <button onClick={close} className="px-4 py-1.5 rounded-md text-sm bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:scale-[1.02] transition-transform">
              Concluir
            </button>
          ) : step === 6 ? (
            <button
              onClick={runImport}
              disabled={running || !mapped || summary?.patients === 0}
              className="px-4 py-1.5 rounded-md text-sm bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:scale-[1.02] transition-transform disabled:opacity-40"
            >
              {running ? 'Importando…' : `Importar ${summary?.patients ?? 0} paciente(s)`}
            </button>
          ) : (
            <button
              onClick={() => {
                if (step === 2 && !canAnalyze) { toast.warning('Falta o arquivo', 'Envie ao menos o CSV de Pacientes.'); return }
                if (step === 2) { analyze(); return } // analisa ao sair do upload
                setStep((s) => s + 1)
              }}
              disabled={(step === 1 && !termsAccepted) || (step === 2 && !canAnalyze)}
              className="px-4 py-1.5 rounded-md text-sm bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:scale-[1.02] transition-transform disabled:opacity-40"
            >
              {step === 2 ? 'Analisar' : 'Continuar'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
