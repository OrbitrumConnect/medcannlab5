/**
 * V1.9.313 — PatientMyExams: paciente sobe exames antigos (laudos, ressonância, EEG)
 *
 * Arquitetura: bucket separado `patient_documents` + tabela `patient_documents`
 * (não reusa Library do médico). Padrão B-lite consent V1.9.311 — paciente decide
 * peça-a-peça se libera pro profissional vinculado.
 *
 * Filosofia (Clinical Cockpit + linguagem estado real):
 * - Copy honesta ("X arquivos · Y compartilhados com seu médico")
 * - Cor por estado (azul info / cyan shared / âmbar pendente categorização)
 * - Empty state direto sem hype
 *
 * Diferença vs PatientNFTGallery:
 * - Aqui PACIENTE upload (não auto-gerado)
 * - 5 categorias fixas (laudo/imagem/relatorio/receita_antiga/outros)
 * - Sem signature_hash (não é artefato criptográfico, é PDF/imagem clínico)
 * - Toggle "Permitir visualização clínica" mesmo padrão V1.9.311
 */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
    FileText, Image as ImageIcon, FileCheck, Pill, MoreHorizontal,
    Upload, X, Trash2, Download, Eye, EyeOff, Loader2, Calendar,
    Filter, AlertCircle, Sparkles
} from 'lucide-react'
import DotPagination from './ui/DotPagination'

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
}

type CategoryFilter = 'all' | PatientDocument['category']

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
    onBack?: () => void
    embedded?: boolean  // true quando renderizado dentro de dashboard (sem padding)
}

export default function PatientMyExams({ onBack, embedded }: Props) {
    const { user } = useAuth()
    const [docs, setDocs] = useState<PatientDocument[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [filter, setFilter] = useState<CategoryFilter>('all')
    const [selectedDoc, setSelectedDoc] = useState<PatientDocument | null>(null)
    const [uploadModalOpen, setUploadModalOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [togglingShareId, setTogglingShareId] = useState<string | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    const loadDocs = async () => {
        if (!user?.id) return
        setLoading(true)
        const { data, error } = await (supabase as any)
            .from('patient_documents')
            .select('*')
            .eq('patient_id', user.id)
            .order('uploaded_at', { ascending: false })
        if (!error && data) setDocs(data as PatientDocument[])
        setLoading(false)
    }

    useEffect(() => { void loadDocs() }, [user?.id])

    const filtered = useMemo(() => {
        if (filter === 'all') return docs
        return docs.filter(d => d.category === filter)
    }, [docs, filter])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = useMemo(() => filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [filtered, page])
    const sharedCount = docs.filter(d => d.shared_with_professional).length

    useEffect(() => { setPage(0) }, [filter])

    // ============================================================================
    // Upload
    // ============================================================================
    const handleUpload = async (file: File, category: PatientDocument['category'], description: string) => {
        if (!user?.id || !file) return
        setUploading(true)
        const ts = Date.now()
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)
        const filePath = `${user.id}/${ts}_${safeName}`

        // 1. Upload storage
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

        // 2. Insert metadata
        const { error: insErr } = await sb.from('patient_documents').insert({
            patient_id: user.id,
            file_path: filePath,
            original_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
            category,
            description: description || null,
        })
        if (insErr) {
            // Rollback storage
            await sb.storage.from('patient_documents').remove([filePath])
            setUploading(false)
            alert('Erro ao salvar metadados: ' + insErr.message)
            return
        }

        setUploading(false)
        setUploadModalOpen(false)
        await loadDocs()
    }

    const handleDelete = async (doc: PatientDocument) => {
        if (!confirm(`Apagar "${doc.original_name}"? Esta ação não pode ser desfeita.`)) return
        const sb = supabase as any
        // Storage primeiro
        await sb.storage.from('patient_documents').remove([doc.file_path])
        // Tabela depois
        await sb.from('patient_documents').delete().eq('id', doc.id).eq('patient_id', user?.id)
        setSelectedDoc(null)
        await loadDocs()
    }

    const handleToggleShare = async (doc: PatientDocument) => {
        if (!user?.id) return
        setTogglingShareId(doc.id)
        const newShared = !doc.shared_with_professional
        const sb = supabase as any
        const { error } = await sb.from('patient_documents').update({
            shared_with_professional: newShared,
            shared_at: newShared ? new Date().toISOString() : null,
            shared_by: newShared ? user.id : null,
        }).eq('id', doc.id).eq('patient_id', user.id)
        setTogglingShareId(null)
        if (error) {
            alert('Erro: ' + error.message)
            return
        }
        setDocs(prev => prev.map(d => d.id === doc.id
            ? { ...d, shared_with_professional: newShared, shared_at: newShared ? new Date().toISOString() : null }
            : d
        ))
        setSelectedDoc(prev => prev?.id === doc.id
            ? { ...prev, shared_with_professional: newShared, shared_at: newShared ? new Date().toISOString() : null }
            : prev
        )
    }

    const handleOpenDoc = async (doc: PatientDocument) => {
        setSelectedDoc(doc)
        // Generate signed URL pra preview
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
        <div className={embedded ? '' : 'p-4 sm:p-6 max-w-6xl mx-auto'}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-emerald-300" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Meus Exames</h1>
                            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                                Exames antigos seus (laudos, ressonância, EEG, receitas anteriores) que você quer ter à mão
                                e opcionalmente compartilhar com seu médico vinculado.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-medium transition-colors"
                    >
                        <Upload className="w-4 h-4" /> Adicionar exame
                    </button>
                </div>

                {/* Stats compactas — copy honesta estado real */}
                {!loading && docs.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4 text-xs">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700">
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-300">{docs.length} {docs.length === 1 ? 'arquivo' : 'arquivos'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700">
                            <Eye className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-slate-300">
                                {sharedCount}/{docs.length} compartilhados com seu médico
                            </span>
                        </div>
                    </div>
                )}

                {/* Filtros categoria */}
                {!loading && docs.length > 0 && (
                    <div className="flex items-center gap-1 mt-4 p-1 rounded-lg bg-slate-800/60 border border-slate-700 overflow-x-auto">
                        <Filter className="w-3.5 h-3.5 text-slate-500 ml-2 flex-shrink-0" />
                        {CATEGORY_FILTERS.map(f => (
                            <button
                                key={f.id}
                                onClick={() => setFilter(f.id)}
                                className={`px-3 py-1 rounded text-[11px] font-semibold whitespace-nowrap transition-colors ${
                                    filter === f.id ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
            )}

            {/* Empty state honesto */}
            {!loading && docs.length === 0 && (
                <div className="text-center py-16 px-6 bg-gradient-to-br from-slate-900/40 to-slate-800/20 rounded-2xl border border-slate-800">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-9 h-9 text-emerald-300/70" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Nenhum exame ainda</h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                        Sobe seu primeiro PDF, foto de laudo ou imagem médica.
                        Você decide se compartilha com seu médico depois.
                    </p>
                    <button
                        onClick={() => setUploadModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-semibold transition-colors"
                    >
                        <Upload className="w-4 h-4 inline mr-2" /> Adicionar primeiro exame
                    </button>
                </div>
            )}

            {/* Grid cards */}
            {!loading && filtered.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {paginated.map(doc => {
                            const meta = CATEGORY_META[doc.category]
                            const Icon = meta.icon
                            return (
                                <button
                                    key={doc.id}
                                    onClick={() => handleOpenDoc(doc)}
                                    className="group text-left bg-slate-900/60 border border-slate-700/40 rounded-xl p-3 hover:border-emerald-500/40 transition-colors"
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
                                        {doc.shared_with_professional && (
                                            <div className="w-4 h-4 rounded-full bg-cyan-500/80 flex items-center justify-center" title="Compartilhado com seu médico">
                                                <Eye className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider ${meta.color} bg-slate-800/60`}>
                                        {meta.label}
                                    </span>
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

            {/* Voltar (se embedded=false) */}
            {!embedded && onBack && (
                <div className="mt-6">
                    <button
                        onClick={onBack}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        ← Voltar
                    </button>
                </div>
            )}

            {/* Modal expandido */}
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
                        {/* Header */}
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
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="flex-1 overflow-auto bg-slate-950">
                            {previewUrl ? (
                                selectedDoc.mime_type?.startsWith('image/') ? (
                                    <img src={previewUrl} alt={selectedDoc.original_name} className="w-full h-auto" />
                                ) : (
                                    <embed src={previewUrl} type="application/pdf" className="w-full h-[60vh]" />
                                )
                            ) : (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                                </div>
                            )}
                        </div>

                        {/* Consent toggle + ações */}
                        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex-shrink-0 space-y-3">
                            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-800/40 border border-slate-700">
                                <Eye className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-semibold text-white mb-0.5">Permitir visualização clínica</div>
                                    <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                                        {selectedDoc.shared_with_professional
                                            ? 'Este exame está visível para seus médicos vinculados.'
                                            : 'Por padrão, apenas você vê. Libere para que seu médico vinculado também possa visualizá-lo.'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleShare(selectedDoc)}
                                            disabled={togglingShareId === selectedDoc.id}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                selectedDoc.shared_with_professional ? 'bg-emerald-500/80' : 'bg-slate-700'
                                            }`}
                                            role="switch"
                                            aria-checked={selectedDoc.shared_with_professional}
                                        >
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                selectedDoc.shared_with_professional ? 'translate-x-5' : 'translate-x-1'
                                            }`} />
                                        </button>
                                        <span className="text-[10px] text-slate-500">
                                            {selectedDoc.shared_with_professional && selectedDoc.shared_at
                                                ? `Liberado em ${formatDate(selectedDoc.shared_at)}`
                                                : 'Apenas você vê'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    onClick={() => handleDelete(selectedDoc)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Apagar
                                </button>
                                {previewUrl && (
                                    <a
                                        href={previewUrl}
                                        download={selectedDoc.original_name}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Baixar
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal upload */}
            {uploadModalOpen && (
                <UploadModal
                    onClose={() => setUploadModalOpen(false)}
                    onUpload={handleUpload}
                    uploading={uploading}
                />
            )}
        </div>
    )
}

// ============================================================================
// UploadModal — submodal pra escolher categoria + descrição + arquivo
// ============================================================================
function UploadModal({ onClose, onUpload, uploading }: {
    onClose: () => void
    onUpload: (file: File, category: PatientDocument['category'], description: string) => void
    uploading: boolean
}) {
    const [file, setFile] = useState<File | null>(null)
    const [category, setCategory] = useState<PatientDocument['category']>('laudo')
    const [description, setDescription] = useState('')
    const [dragActive, setDragActive] = useState(false)

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const f = e.dataTransfer.files?.[0]
        if (f) setFile(f)
    }

    const submit = () => {
        if (!file) return
        onUpload(file, category, description)
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white">Adicionar exame</h3>
                    <button onClick={onClose} disabled={uploading} className="text-slate-400 hover:text-white disabled:opacity-50">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Drop zone */}
                <label
                    htmlFor="file-input"
                    onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                        dragActive ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-slate-700 hover:border-emerald-500/40'
                    }`}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        disabled={uploading}
                        className="hidden"
                    />
                    {file ? (
                        <div className="space-y-1">
                            <FileText className="w-8 h-8 text-emerald-400 mx-auto" />
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

                {/* Categoria */}
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
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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

                {/* Descrição (opcional) */}
                <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Descrição (opcional)
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Ressonância de 2024, EEG da crise de janeiro..."
                        maxLength={200}
                        disabled={uploading}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40"
                    />
                </div>

                {/* Ações */}
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
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 disabled:opacity-50 text-emerald-200 border border-emerald-500/30 rounded-lg text-xs font-semibold"
                    >
                        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {uploading ? 'Enviando...' : 'Enviar'}
                    </button>
                </div>
            </div>
        </div>
    )
}
