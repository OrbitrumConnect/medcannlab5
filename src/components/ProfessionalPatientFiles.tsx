/**
 * V1.9.326 — ProfessionalPatientFiles
 *
 * Médico anexa exames/laudos/resultados ao prontuário do paciente vinculado.
 * Reusa patient_documents (V1.9.313). Vê:
 *   - documentos que o paciente compartilhou (shared_with_professional=true)
 *   - documentos que o próprio médico anexou (uploaded_by_role='professional')
 *
 * REGRA Pedro 17/05 opção A:
 *   - Doc do médico é IMUTÁVEL pro paciente (paciente só visualiza)
 *   - RLS no banco força isso (Patient DELETE só com uploaded_by_role='patient')
 *
 * Padrão visual espelha PatientMyExams (V1.9.313) — mesma UX, contexto profissional.
 */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
    FileText, Image as ImageIcon, FileCheck, Pill, MoreHorizontal,
    Upload, X, Trash2, Download, Loader2, Filter, Stethoscope, User as UserIcon
} from 'lucide-react'
import DotPagination from './ui/DotPagination'
import { notificationService } from '../services/notificationService'

interface PatientDocument {
    id: string
    patient_id: string
    file_path: string
    original_name: string
    mime_type: string | null
    size_bytes: number | null
    category: 'laudo' | 'imagem' | 'relatorio' | 'receita_antiga' | 'outros'
    description: string | null
    uploaded_at: string
    shared_with_professional: boolean
    shared_at: string | null
    uploaded_by: string | null
    uploaded_by_role: 'patient' | 'professional' | null
    clinical_note: string | null
}

type CategoryFilter = 'all' | PatientDocument['category']
type SourceFilter = 'all' | 'professional' | 'patient'

const PAGE_SIZE = 8

const CATEGORY_META: Record<PatientDocument['category'], { label: string; icon: typeof FileText; color: string }> = {
    laudo: { label: 'Laudo', icon: FileCheck, color: 'text-blue-300' },
    imagem: { label: 'Imagem médica', icon: ImageIcon, color: 'text-purple-300' },
    relatorio: { label: 'Relatório', icon: FileText, color: 'text-emerald-300' },
    receita_antiga: { label: 'Receita anterior', icon: Pill, color: 'text-pink-300' },
    outros: { label: 'Outros', icon: MoreHorizontal, color: 'text-slate-300' },
}

const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'laudo', label: 'Laudos' },
    { id: 'imagem', label: 'Imagens' },
    { id: 'relatorio', label: 'Relatórios' },
    { id: 'receita_antiga', label: 'Receitas antigas' },
    { id: 'outros', label: 'Outros' },
]

function formatBytes(bytes: number | null): string {
    if (!bytes) return '—'
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return iso.slice(0, 10) }
}

interface Props {
    patientId: string
    patientName?: string
}

export default function ProfessionalPatientFiles({ patientId, patientName }: Props) {
    const { user } = useAuth()
    const [docs, setDocs] = useState<PatientDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [filter, setFilter] = useState<CategoryFilter>('all')
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
    const [selectedDoc, setSelectedDoc] = useState<PatientDocument | null>(null)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const loadDocs = async () => {
        if (!patientId) return
        setLoading(true)
        const { data, error } = await (supabase as any)
            .from('patient_documents')
            .select('*')
            .eq('patient_id', patientId)
            .order('uploaded_at', { ascending: false })
        if (!error && data) setDocs(data as PatientDocument[])
        setLoading(false)
    }

    useEffect(() => { void loadDocs() }, [patientId])

    const filtered = useMemo(() => {
        let result = docs
        if (filter !== 'all') result = result.filter(d => d.category === filter)
        if (sourceFilter !== 'all') result = result.filter(d => d.uploaded_by_role === sourceFilter)
        return result
    }, [docs, filter, sourceFilter])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page])

    const byProfessional = docs.filter(d => d.uploaded_by_role === 'professional').length
    const byPatient = docs.filter(d => d.uploaded_by_role === 'patient').length

    useEffect(() => { setPage(0) }, [filter, sourceFilter])

    // Upload pelo médico
    const handleUpload = async (file: File, category: PatientDocument['category'], description: string, clinicalNote: string) => {
        if (!user?.id || !file || !patientId) return
        setUploading(true)
        const ts = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
        const filePath = `${patientId}/${ts}_${safeName}`

        const sb = supabase as any
        const { error: upErr } = await sb.storage.from('patient_documents').upload(filePath, file, {
            contentType: file.type,
            upsert: false
        })
        if (upErr) {
            setUploading(false)
            alert('Erro ao enviar arquivo: ' + upErr.message)
            return
        }

        const { error: insErr } = await sb.from('patient_documents').insert({
            patient_id: patientId,
            file_path: filePath,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            category,
            description: description || null,
            uploaded_by: user.id,
            uploaded_by_role: 'professional',
            clinical_note: clinicalNote || null,
            shared_with_professional: true,
            shared_at: new Date().toISOString(),
            shared_by: user.id,
        })
        if (insErr) {
            await sb.storage.from('patient_documents').remove([filePath])
            setUploading(false)
            alert('Erro ao salvar metadados: ' + insErr.message)
            return
        }

        // Notifica paciente (best-effort)
        try {
            await notificationService.createNotification({
                user_id: patientId,
                title: 'Novo exame anexado pelo seu médico',
                message: `Seu médico anexou: ${file.name}. Acesse "Meus Exames" para visualizar.`,
                type: 'clinical',
                is_read: false,
            })
        } catch (notifErr) {
            console.warn('Notificação não enviada:', notifErr)
        }

        setUploading(false)
        setUploadModalOpen(false)
        await loadDocs()
    }

    const handleDelete = async (doc: PatientDocument) => {
        // Só pode deletar o que ele mesmo subiu (RLS força, mas UX espelha)
        if (doc.uploaded_by !== user?.id) {
            alert('Você só pode apagar documentos que você anexou.')
            return
        }
        if (!confirm(`Apagar "${doc.original_name}"? Esta ação não pode ser desfeita.`)) return
        setDeletingId(doc.id)
        const sb = supabase as any
        await sb.storage.from('patient_documents').remove([doc.file_path])
        await sb.from('patient_documents').delete().eq('id', doc.id)
        setDeletingId(null)
        setSelectedDoc(null)
        await loadDocs()
    }

    const handleOpenDoc = async (doc: PatientDocument) => {
        setSelectedDoc(doc)
        const sb = supabase as any
        const { data, error } = await sb.storage.from('patient_documents')
            .createSignedUrl(doc.file_path, 3600)
        if (!error && data?.signedUrl) {
            setPreviewUrl(data.signedUrl)
        } else {
            setPreviewUrl(null)
        }
    }

    const closeModal = () => {
        setSelectedDoc(null)
        setPreviewUrl(null)
    }

    return (
        <div>
            {/* Header + Upload */}
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-base font-semibold text-white">Arquivos do prontuário</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Anexe exames, laudos e resultados externos. Documentos anexados ficam visíveis ao paciente, mas só você pode editá-los ou removê-los.
                    </p>
                </div>
                <button
                    onClick={() => setUploadModalOpen(true)}
                    className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-medium transition-all hover:scale-[1.02]"
                >
                    <Upload className="w-3.5 h-3.5" /> Anexar arquivo
                </button>
            </div>

            {/* Stats + filtros origem */}
            {!loading && docs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 text-xs">
                    <button
                        onClick={() => setSourceFilter('all')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                            sourceFilter === 'all' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5" /> Todos ({docs.length})
                    </button>
                    <button
                        onClick={() => setSourceFilter('professional')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                            sourceFilter === 'professional' ? 'bg-purple-500/20 border-purple-500/40 text-purple-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                    >
                        <Stethoscope className="w-3.5 h-3.5" /> Anexados por médico ({byProfessional})
                    </button>
                    <button
                        onClick={() => setSourceFilter('patient')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors ${
                            sourceFilter === 'patient' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                    >
                        <UserIcon className="w-3.5 h-3.5" /> Enviados pelo paciente ({byPatient})
                    </button>
                </div>
            )}

            {/* Filtros categoria */}
            {!loading && docs.length > 0 && (
                <div className="flex items-center gap-1 mb-4 p-1 rounded-lg bg-slate-800/60 border border-slate-700 overflow-x-auto">
                    <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 flex-shrink-0" />
                    {CATEGORY_FILTERS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors ${
                                filter === f.id ? 'bg-purple-500/20 text-purple-200' : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                </div>
            )}

            {!loading && docs.length === 0 && (
                <div className="text-center py-12 px-6 bg-gradient-to-br from-slate-900/40 to-slate-800/20 rounded-2xl border border-slate-800">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <FileText className="w-7 h-7 text-purple-300/70" />
                    </div>
                    <h3 className="text-base font-bold text-white mb-2">Nenhum arquivo no prontuário</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
                        Anexe exames de laboratório, laudos de imagem, receitas externas ou pareceres recebidos fora do app.
                    </p>
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-sm font-medium transition-all hover:scale-[1.02]"
                    >
                        <Upload className="w-4 h-4" /> Anexar primeiro arquivo
                    </button>
                </div>
            )}

            {!loading && filtered.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {paginated.map(doc => {
                            const meta = CATEGORY_META[doc.category]
                            const Icon = meta.icon
                            const isMine = doc.uploaded_by === user?.id
                            const isProfessional = doc.uploaded_by_role === 'professional'
                            return (
                                <button
                                    key={doc.id}
                                    onClick={() => handleOpenDoc(doc)}
                                    className={`group text-left bg-slate-900/60 border rounded-xl p-3 transition-colors ${
                                        isProfessional ? 'border-purple-500/20 hover:border-purple-500/40' : 'border-emerald-500/20 hover:border-emerald-500/40'
                                    }`}
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className={`p-2 rounded-lg bg-slate-800/60 ${meta.color}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-white truncate">{doc.original_name}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                                {formatDate(doc.uploaded_at)} · {formatBytes(doc.size_bytes)}
                                            </p>
                                        </div>
                                        <div title={isProfessional ? (isMine ? 'Anexado por você' : 'Anexado por outro médico') : 'Enviado pelo paciente'}>
                                            {isProfessional ? (
                                                <Stethoscope className={`w-3.5 h-3.5 ${isMine ? 'text-purple-300' : 'text-slate-500'}`} />
                                            ) : (
                                                <UserIcon className="w-3.5 h-3.5 text-emerald-300" />
                                            )}
                                        </div>
                                    </div>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${meta.color} bg-slate-800/60`}>
                                        {meta.label}
                                    </span>
                                    {doc.clinical_note && (
                                        <p className="text-[10px] text-slate-400 mt-1.5 line-clamp-2 italic">"{doc.clinical_note}"</p>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <DotPagination
                        currentPage={page + 1}
                        totalPages={totalPages}
                        onPageChange={(p) => setPage(p - 1)}
                    />
                </>
            )}

            {/* Modal preview */}
            {selectedDoc && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 flex-shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                                {(() => {
                                    const Icon = CATEGORY_META[selectedDoc.category].icon
                                    return <Icon className={`w-4 h-4 flex-shrink-0 ${CATEGORY_META[selectedDoc.category].color}`} />
                                })()}
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-white truncate">{selectedDoc.original_name}</h3>
                                    <p className="text-[11px] text-slate-400">
                                        {CATEGORY_META[selectedDoc.category].label} · {formatDate(selectedDoc.uploaded_at)} · {formatBytes(selectedDoc.size_bytes)}
                                        {selectedDoc.uploaded_by_role === 'professional'
                                            ? ' · Anexado pelo médico'
                                            : ' · Enviado pelo paciente'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto bg-slate-950">
                            {previewUrl ? (
                                selectedDoc.mime_type?.startsWith('image/') ? (
                                    <img src={previewUrl} alt={selectedDoc.original_name} className="w-full h-auto" />
                                ) : (
                                    <embed src={previewUrl} type="application/pdf" className="w-full h-[60vh]" />
                                )
                            ) : (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                                </div>
                            )}
                        </div>

                        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex-shrink-0 space-y-3">
                            {selectedDoc.clinical_note && (
                                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Anotação clínica</div>
                                    <p className="text-xs text-slate-200 italic">"{selectedDoc.clinical_note}"</p>
                                </div>
                            )}
                            {selectedDoc.description && (
                                <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Descrição</div>
                                    <p className="text-xs text-slate-200">{selectedDoc.description}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between gap-2">
                                {selectedDoc.uploaded_by === user?.id ? (
                                    <button
                                        onClick={() => handleDelete(selectedDoc)}
                                        disabled={deletingId === selectedDoc.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === selectedDoc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                        Apagar
                                    </button>
                                ) : <div />}
                                {previewUrl && (
                                    <a
                                        href={previewUrl}
                                        download={selectedDoc.original_name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Baixar
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {uploadModalOpen && (
                <UploadModalProfessional
                    onClose={() => setUploadModalOpen(false)}
                    onUpload={handleUpload}
                    uploading={uploading}
                    patientName={patientName}
                />
            )}
        </div>
    )
}

function UploadModalProfessional({ onClose, onUpload, uploading, patientName }: {
    onClose: () => void
    onUpload: (file: File, category: PatientDocument['category'], description: string, clinicalNote: string) => void
    uploading: boolean
    patientName?: string
}) {
    const [file, setFile] = useState<File | null>(null)
    const [category, setCategory] = useState<PatientDocument['category']>('laudo')
    const [description, setDescription] = useState('')
    const [clinicalNote, setClinicalNote] = useState('')
    const [dragActive, setDragActive] = useState(false)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const f = e.dataTransfer.files?.[0]
        if (f) setFile(f)
    }

    const submit = () => {
        if (!file) return
        onUpload(file, category, description, clinicalNote)
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-white">Anexar arquivo ao prontuário</h3>
                        {patientName && (
                            <p className="text-xs text-slate-400 mt-0.5">Paciente: {patientName}</p>
                        )}
                    </div>
                    <button onClick={onClose} disabled={uploading} className="text-slate-400 hover:text-white disabled:opacity-50">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <label
                    htmlFor="prof-file-input"
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        dragActive ? 'border-purple-500/60 bg-purple-500/5' : 'border-slate-700 hover:border-purple-500/40'
                    }`}
                >
                    <input
                        id="prof-file-input"
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        disabled={uploading}
                        className="hidden"
                    />
                    {file ? (
                        <div className="space-y-1">
                            <FileText className="w-8 h-8 text-purple-400 mx-auto" />
                            <p className="text-sm font-semibold text-white truncate">{file.name}</p>
                            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <Upload className="w-8 h-8 text-slate-500 mx-auto" />
                            <p className="text-xs text-slate-400">Clique ou arraste o arquivo aqui</p>
                            <p className="text-[10px] text-slate-600">PDF, JPG, PNG, WebP, GIF — até 20MB</p>
                        </div>
                    )}
                </label>

                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoria</label>
                    <div className="grid grid-cols-2 gap-1.5">
                        {(Object.keys(CATEGORY_META) as PatientDocument['category'][]).map(cat => {
                            const meta = CATEGORY_META[cat]
                            const Icon = meta.icon
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        category === cat
                                            ? 'bg-purple-500/20 text-purple-200 border border-purple-500/40'
                                            : 'bg-slate-800/40 text-slate-300 border border-slate-700 hover:border-slate-600'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    {meta.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Descrição (opcional)
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: USG abdominal de mar/2026"
                        maxLength={200}
                        disabled={uploading}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/40"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Anotação clínica (opcional)
                    </label>
                    <textarea
                        value={clinicalNote}
                        onChange={(e) => setClinicalNote(e.target.value)}
                        placeholder="Ex: Trazido em consulta 17/05. Confirma DRC G3b — eGFR 30."
                        maxLength={500}
                        rows={3}
                        disabled={uploading}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/40 resize-none"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">Visível ao paciente. Ex: contexto, achados, próxima conduta.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-white disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={submit}
                        disabled={!file || uploading}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 disabled:opacity-50 text-purple-200 border border-purple-500/30 rounded-lg text-xs font-semibold"
                    >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploading ? 'Enviando...' : 'Anexar ao prontuário'}
                    </button>
                </div>
            </div>
        </div>
    )
}
