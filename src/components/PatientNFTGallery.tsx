/**
 * V1.9.193 — Galeria de Assinaturas Visuais (NFT lógico clínico)
 *
 * Cada peça é uma representação simbólica de um momento clínico,
 * criptograficamente ancorada via:
 *   - signature_hash do clinical_report (ICP-Brasil PKCS#7)
 *   - SHA-256 da imagem (integridade)
 *   - seed determinística sha256(patient_id + report_id) (unicidade)
 *
 * Sem blockchain. Sem wallet. Sem custos cripto.
 * Soulbound by RLS (não-transferível por design clínico).
 *
 * UX: paginação 10/page · grid responsive · modal expanded com cadeia de
 * confiança visível · empty state elegante.
 */
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
    Sparkles, ChevronLeft, ChevronRight, X,
    Shield, Hash, Calendar, Palette, Eye,
    Loader2, ImageIcon, FileCheck, ArrowUpRight
} from 'lucide-react'

interface PatientNFT {
    id: string
    patient_id: string
    report_id: string
    image_url: string
    thumbnail_url: string | null
    image_hash: string
    signature_hash: string | null
    style: string
    emotional_sig: string | null
    palette: string[]
    symbols: string[]
    seed: string
    prompt: string | null
    model: string
    generation_version: string
    narrative_window: any
    created_at: string
    metadata: any
}

const PAGE_SIZE = 10

const STYLE_LABELS: Record<string, { label: string; color: string }> = {
    'neuro-organic': { label: 'Neuro-Organic', color: 'text-emerald-300' },
    'healing-fractals': { label: 'Healing Fractals', color: 'text-cyan-300' },
    'orbit-consciousness': { label: 'Orbit Consciousness', color: 'text-purple-300' },
    'dreamcore-medical': { label: 'Dreamcore', color: 'text-pink-300' },
    'emotional-archive': { label: 'Emotional Archive', color: 'text-amber-300' },
    'cognitive-nebula': { label: 'Cognitive Nebula', color: 'text-blue-300' },
    'v1_neuro_organic': { label: 'Neuro-Organic v1', color: 'text-emerald-300' },
}

interface PatientNFTGalleryProps {
    onCreateAssessment?: () => void
}

export default function PatientNFTGallery({ onCreateAssessment }: PatientNFTGalleryProps) {
    const { user } = useAuth()
    const [nfts, setNfts] = useState<PatientNFT[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [selectedNFT, setSelectedNFT] = useState<PatientNFT | null>(null)

    useEffect(() => {
        if (!user?.id) return

        const fetchNFTs = async () => {
            setLoading(true)
            try {
                // patient_nfts é nova (V1.9.193) — types ainda não regenerados.
                // Cast as any temporário até `supabase gen types` rodar no CI.
                const sb = supabase as any

                // Count total para paginação
                const { count } = await sb
                    .from('patient_nfts')
                    .select('*', { count: 'exact', head: true })
                    .eq('patient_id', user.id)

                setTotalCount(count || 0)

                // Página atual (10 itens)
                const fromIdx = page * PAGE_SIZE
                const toIdx = fromIdx + PAGE_SIZE - 1

                const { data, error } = await sb
                    .from('patient_nfts')
                    .select('*')
                    .eq('patient_id', user.id)
                    .order('created_at', { ascending: false })
                    .range(fromIdx, toIdx)

                if (error) {
                    console.error('Error loading NFT gallery:', error)
                    setNfts([])
                } else {
                    setNfts((data as PatientNFT[]) || [])
                }
            } catch (err) {
                console.error('Unexpected error:', err)
                setNfts([])
            } finally {
                setLoading(false)
            }
        }

        void fetchNFTs()
    }, [user?.id, page])

    const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
    const isEmpty = !loading && nfts.length === 0

    const formatDate = (iso: string) => {
        try {
            return new Date(iso).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', year: 'numeric'
            })
        } catch {
            return iso.slice(0, 10)
        }
    }

    const formatHash = (hash: string | null, len = 8) => {
        if (!hash) return '—'
        return `${hash.slice(0, len)}...${hash.slice(-4)}`
    }

    return (
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
            {/* HEADER */}
            <div className="mb-6">
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Galeria de Assinaturas Visuais
                        </h1>
                        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            Cada peça representa um momento clínico único, ancorado criptograficamente
                            ao seu histórico. Geradas a partir do conteúdo simbólico de cada relatório
                            finalizado, validadas via ICP-Brasil.
                        </p>
                    </div>
                </div>

                {/* Stats compactas */}
                {!isEmpty && !loading && (
                    <div className="flex flex-wrap gap-3 mt-4 text-xs">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-300">{totalCount} {totalCount === 1 ? 'peça' : 'peças'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700">
                            <Shield className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-300">Soulbound · não-transferível</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700">
                            <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-300">ICP-Brasil ancorado</span>
                        </div>
                    </div>
                )}
            </div>

            {/* LOADING */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
            )}

            {/* EMPTY STATE */}
            {isEmpty && (
                <div className="text-center py-16 px-6 bg-gradient-to-br from-slate-900/40 to-slate-800/20 rounded-2xl border border-slate-800">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Sparkles className="w-9 h-9 text-emerald-300/70" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                        Sua galeria começará a se preencher em breve
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
                        Cada relatório clínico finalizado pode gerar uma assinatura visual única,
                        derivada do seu próprio relato e ancorada ao hash do documento. Sem blockchain
                        externa — apenas o vínculo criptográfico nativo do seu prontuário.
                    </p>
                    {onCreateAssessment && (
                        <button
                            onClick={onCreateAssessment}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Iniciar uma avaliação
                        </button>
                    )}
                </div>
            )}

            {/* GRID */}
            {!loading && !isEmpty && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {nfts.map((nft) => {
                            const styleInfo = STYLE_LABELS[nft.style] || STYLE_LABELS[nft.generation_version] || { label: nft.style, color: 'text-slate-300' }
                            return (
                                <button
                                    key={nft.id}
                                    onClick={() => setSelectedNFT(nft)}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10"
                                    title={`${styleInfo.label} · ${formatDate(nft.created_at)}`}
                                >
                                    {nft.thumbnail_url || nft.image_url ? (
                                        <img
                                            src={nft.thumbnail_url || nft.image_url}
                                            alt={`Assinatura visual ${formatDate(nft.created_at)}`}
                                            loading="lazy"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                ;(e.target as HTMLImageElement).style.display = 'none'
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                            <ImageIcon className="w-8 h-8 text-slate-600" />
                                        </div>
                                    )}
                                    {/* overlay com info ao hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                        <div className="text-left">
                                            <div className={`text-[10px] font-semibold ${styleInfo.color} truncate`}>
                                                {styleInfo.label}
                                            </div>
                                            <div className="text-[9px] text-slate-300/80 truncate">
                                                {formatDate(nft.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    {/* badge ICP no canto se signature_hash presente */}
                                    {nft.signature_hash && (
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500/90 flex items-center justify-center" title="Validado via ICP-Brasil">
                                            <Shield className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* PAGINAÇÃO */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 px-2">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-800/60 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-300"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Anterior
                            </button>
                            <div className="text-xs text-slate-400">
                                Página <span className="text-white font-semibold">{page + 1}</span> de{' '}
                                <span className="text-white font-semibold">{totalPages}</span>
                                <span className="ml-2 text-slate-500">· {PAGE_SIZE} por página</span>
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-800/60 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-300"
                            >
                                Próxima
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* MODAL EXPANDED */}
            {selectedNFT && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedNFT(null)}
                >
                    <div
                        className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
                            <div>
                                <h3 className="text-base font-bold text-white">Assinatura Visual</h3>
                                <p className="text-xs text-slate-400">
                                    {formatDate(selectedNFT.created_at)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedNFT(null)}
                                className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal scroll content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* Imagem grande */}
                            <div className="aspect-square w-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                {selectedNFT.image_url ? (
                                    <img
                                        src={selectedNFT.image_url}
                                        alt="Assinatura visual"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : (
                                    <ImageIcon className="w-16 h-16 text-slate-600" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-5 space-y-4">
                                {/* Estilo + emoção */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-start gap-2">
                                        <Palette className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Estilo</div>
                                            <div className="text-sm text-white font-medium">
                                                {(STYLE_LABELS[selectedNFT.style] || STYLE_LABELS[selectedNFT.generation_version])?.label || selectedNFT.style}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedNFT.emotional_sig && (
                                        <div className="flex items-start gap-2">
                                            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wide">Emoção</div>
                                                <div className="text-sm text-white font-medium capitalize">
                                                    {selectedNFT.emotional_sig}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Paleta */}
                                {selectedNFT.palette && selectedNFT.palette.length > 0 && (
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Paleta</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedNFT.palette.map((color, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300 capitalize">
                                                    {color}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Símbolos */}
                                {selectedNFT.symbols && selectedNFT.symbols.length > 0 && (
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1.5">Símbolos</div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {selectedNFT.symbols.map((sym, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                                                    {sym.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cadeia de confiança */}
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                                        <Shield className="w-3.5 h-3.5" />
                                        Cadeia de Confiança
                                    </div>
                                    <div className="space-y-1.5 text-xs">
                                        <div className="flex items-start gap-2">
                                            <Hash className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-slate-500">Hash imagem:</span>{' '}
                                                <code className="text-slate-300 font-mono text-[10px] break-all">
                                                    {formatHash(selectedNFT.image_hash, 16)}
                                                </code>
                                            </div>
                                        </div>
                                        {selectedNFT.signature_hash && (
                                            <div className="flex items-start gap-2">
                                                <FileCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-slate-500">Validado via ICP-Brasil:</span>{' '}
                                                    <code className="text-emerald-300 font-mono text-[10px] break-all">
                                                        {formatHash(selectedNFT.signature_hash, 16)}
                                                    </code>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2">
                                            <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-slate-500">Criado em:</span>{' '}
                                                <span className="text-slate-300">
                                                    {new Date(selectedNFT.created_at).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-500 italic pt-1">
                                            Soulbound · não-transferível · LGPD-compliant
                                        </div>
                                    </div>
                                </div>

                                {/* Janela peri-event (se existe) */}
                                {selectedNFT.narrative_window && Object.keys(selectedNFT.narrative_window).length > 0 && (
                                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                                        <div className="text-[10px] text-cyan-300 uppercase tracking-wide mb-1.5 font-semibold">Janela Peri-Event</div>
                                        <div className="text-xs text-slate-300 font-mono">
                                            {selectedNFT.narrative_window.t0_event && (
                                                <div>Evento: {selectedNFT.narrative_window.t0_event.replace(/_/g, ' ')}</div>
                                            )}
                                            {selectedNFT.narrative_window.event_date && (
                                                <div className="text-slate-400">Data: {selectedNFT.narrative_window.event_date}</div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal footer actions */}
                        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/30 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setSelectedNFT(null)}
                                className="px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Fechar
                            </button>
                            {selectedNFT.report_id && (
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                                    onClick={() => {
                                        // Próximo passo: navegar pro report origem
                                        setSelectedNFT(null)
                                    }}
                                >
                                    <Eye className="w-4 h-4" />
                                    Ver relatório origem
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
