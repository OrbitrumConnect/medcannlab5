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
import { useNavigate } from 'react-router-dom'
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
    // V1.9.311 — consent pattern (B-lite). Paciente libera peça-a-peça pro
    // profissional ver via <ProfessionalNFTGallery />. Default false = consent
    // explícito necessário (alinhado com referral consent V1.9.275).
    shared_with_professional?: boolean
    shared_at?: string | null
    shared_by?: string | null
}

const PAGE_SIZE = 10

/**
 * Converte URL Pollinations.ai para versão thumbnail (320px) reduzindo tráfego do grid.
 * Tier A perf optimization: imagem cheia 512×512 vira 320×320 no grid; modal expanded
 * mantém URL original via getFullUrl(). Para URLs não-Pollinations devolve original.
 */
function getThumbnailUrl(url: string | null | undefined): string | null {
    if (!url) return null
    if (!url.includes('image.pollinations.ai')) return url
    try {
        const u = new URL(url)
        u.searchParams.set('width', '320')
        u.searchParams.set('height', '320')
        return u.toString()
    } catch {
        return url
    }
}

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
    const navigate = useNavigate()
    const [nfts, setNfts] = useState<PatientNFT[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [selectedNFT, setSelectedNFT] = useState<PatientNFT | null>(null)
    const [togglingShareId, setTogglingShareId] = useState<string | null>(null)

    /**
     * V1.9.311 — Toggle consent paciente→profissional.
     * Atualiza shared_with_professional + shared_at + shared_by no banco.
     * RLS policy "Patient toggles share on own NFTs" garante que só o próprio
     * paciente pode mudar (auth.uid() = patient_id).
     */
    const handleToggleShare = async (nft: PatientNFT) => {
        if (!user?.id) return
        setTogglingShareId(nft.id)
        const newShared = !nft.shared_with_professional
        const sb = supabase as any
        const { error } = await sb
            .from('patient_nfts')
            .update({
                shared_with_professional: newShared,
                shared_at: newShared ? new Date().toISOString() : null,
                shared_by: newShared ? user.id : null
            })
            .eq('id', nft.id)
            .eq('patient_id', user.id)
        setTogglingShareId(null)
        if (error) {
            alert('Não foi possível atualizar: ' + error.message)
            return
        }
        // Atualiza estado local sem refetch (UX ágil)
        setNfts(prev => prev.map(n => n.id === nft.id
            ? { ...n, shared_with_professional: newShared, shared_at: newShared ? new Date().toISOString() : null, shared_by: newShared ? user.id : null }
            : n
        ))
        setSelectedNFT(prev => prev?.id === nft.id
            ? { ...prev, shared_with_professional: newShared, shared_at: newShared ? new Date().toISOString() : null, shared_by: newShared ? user.id : null }
            : prev
        )
    }

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
                        {/*
                          V1.9.311: copy honesta — antes prometia "validadas via ICP-Brasil"
                          universalmente. Empíricamente apenas peças cujo report-pai foi
                          assinado têm signature_hash. Estado real exibido nos badges abaixo.
                        */}
                        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            Geradas a partir do conteúdo simbólico de relatórios clínicos finalizados.
                            Algumas peças possuem ancoragem criptográfica vinculada à assinatura
                            ICP-Brasil do relatório de origem.
                        </p>
                    </div>
                </div>

                {/* Stats compactas — V1.9.311: badge ICP virou contador estado-real */}
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
                            <span className="text-slate-300">
                                {nfts.filter(n => n.signature_hash).length}/{nfts.length} ancoradas criptograficamente
                            </span>
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
                                            src={getThumbnailUrl(nft.thumbnail_url || nft.image_url) || (nft.thumbnail_url || nft.image_url)}
                                            alt={`Assinatura visual ${formatDate(nft.created_at)}`}
                                            loading="lazy"
                                            decoding="async"
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
                                    {/*
                                      V1.9.311: 2 estados visuais factualmente honestos.
                                      ✅ verde = signature_hash presente (report ICP-assinado)
                                      🟡 âmbar = signature_hash null (report incompleto/draft/teste)
                                      Sem mais badge único universal. Estado real auditável.
                                    */}
                                    {nft.signature_hash ? (
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500/90 flex items-center justify-center" title="Ancorado em assinatura ICP-Brasil">
                                            <Shield className="w-3 h-3 text-white" />
                                        </div>
                                    ) : (
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500/80 flex items-center justify-center" title="Sem ancoragem criptográfica (relatório de origem não foi assinado)">
                                            <Hash className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                    {/* V1.9.311: badge "compartilhado" se paciente liberou peça pro profissional */}
                                    {nft.shared_with_professional && (
                                        <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-cyan-500/80 flex items-center justify-center" title="Permitido para visualização clínica">
                                            <Eye className="w-3 h-3 text-white" />
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

            {/* MODAL EXPANDED — V1.9.197: layout 2-colunas (imagem | info), sem scroll em desktop ≥md */}
            {selectedNFT && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedNFT(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="nft-gallery-modal-title"
                    onKeyDown={(e) => { if (e.key === 'Escape') setSelectedNFT(null) }}
                >
                    <div
                        className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <div>
                                    <h3 id="nft-gallery-modal-title" className="text-sm font-bold text-white">Assinatura Visual</h3>
                                    <p className="text-[11px] text-slate-400">
                                        {formatDate(selectedNFT.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNFT(null)}
                                className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                                aria-label="Fechar assinatura visual"
                                title="Fechar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal body — 2 cols em desktop, 1 col mobile */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-y-auto md:overflow-hidden custom-scrollbar">
                            {/* IMAGEM (col esquerda em desktop, topo em mobile) */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-4 md:p-6 md:overflow-hidden">
                                {selectedNFT.image_url ? (
                                    <img
                                        src={selectedNFT.image_url}
                                        alt="Assinatura visual"
                                        className="w-full max-w-md object-contain rounded-lg shadow-2xl"
                                    />
                                ) : (
                                    <ImageIcon className="w-16 h-16 text-slate-600" />
                                )}
                            </div>

                            {/* INFO (col direita em desktop, abaixo em mobile) */}
                            <div className="p-4 md:p-5 md:overflow-y-auto custom-scrollbar space-y-3">
                                {/* Estilo + emoção */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="flex items-start gap-1.5">
                                        <Palette className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Estilo</div>
                                            <div className="text-xs text-white font-medium truncate">
                                                {(STYLE_LABELS[selectedNFT.style] || STYLE_LABELS[selectedNFT.generation_version])?.label || selectedNFT.style}
                                            </div>
                                        </div>
                                    </div>
                                    {selectedNFT.emotional_sig && (
                                        <div className="flex items-start gap-1.5">
                                            <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0">
                                                <div className="text-[9px] text-slate-500 uppercase tracking-wide">Emoção</div>
                                                <div className="text-xs text-white font-medium capitalize truncate">
                                                    {selectedNFT.emotional_sig}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Paleta */}
                                {selectedNFT.palette && selectedNFT.palette.length > 0 && (
                                    <div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Paleta</div>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedNFT.palette.map((color, i) => (
                                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 capitalize">
                                                    {color}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Símbolos */}
                                {selectedNFT.symbols && selectedNFT.symbols.length > 0 && (
                                    <div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Símbolos</div>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedNFT.symbols.map((sym, i) => (
                                                <span key={i} className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] text-purple-300">
                                                    {sym.replace(/_/g, ' ')}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Cadeia de confiança */}
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold">
                                        <Shield className="w-3 h-3" />
                                        Cadeia de Confiança
                                    </div>
                                    <div className="space-y-1 text-[10px]">
                                        <div className="flex items-start gap-1.5">
                                            <Hash className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-slate-500">Hash:</span>{' '}
                                                <code className="text-slate-300 font-mono text-[9px] break-all">
                                                    {formatHash(selectedNFT.image_hash, 12)}
                                                </code>
                                            </div>
                                        </div>
                                        {selectedNFT.signature_hash && (
                                            <div className="flex items-start gap-1.5">
                                                <FileCheck className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-slate-500">ICP-Brasil:</span>{' '}
                                                    <code className="text-emerald-300 font-mono text-[9px] break-all">
                                                        {formatHash(selectedNFT.signature_hash, 12)}
                                                    </code>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-start gap-1.5">
                                            <Calendar className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-slate-500">Criado:</span>{' '}
                                                <span className="text-slate-300">
                                                    {new Date(selectedNFT.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-slate-500 italic pt-0.5">
                                            Soulbound · não-transferível · LGPD-compliant
                                        </div>
                                    </div>
                                </div>

                                {/* Janela peri-event (se existe) */}
                                {selectedNFT.narrative_window && Object.keys(selectedNFT.narrative_window).length > 0 && (
                                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-2.5">
                                        <div className="text-[9px] text-cyan-300 uppercase tracking-wide mb-1 font-semibold">Janela Peri-Event</div>
                                        <div className="text-[10px] text-slate-300 font-mono">
                                            {selectedNFT.narrative_window.t0_event && (
                                                <div>Evento: {selectedNFT.narrative_window.t0_event.replace(/_/g, ' ')}</div>
                                            )}
                                            {selectedNFT.narrative_window.event_date && (
                                                <div className="text-slate-400">Data: {selectedNFT.narrative_window.event_date}</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/*
                                  V1.9.311 — Consent paciente→profissional (B-lite).
                                  Default false: peça é privada até paciente liberar explícito.
                                  Filosofia alinhada com referral consent V1.9.275 + autonomia
                                  do paciente sobre artefatos simbólicos derivados da própria
                                  narrativa clínica.
                                */}
                                <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-2.5">
                                    <div className="flex items-start gap-2">
                                        <Eye className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-semibold text-white mb-0.5">
                                                Permitir visualização clínica
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                                                {selectedNFT.shared_with_professional
                                                    ? <>Esta peça está visível para o profissional responsável pelo relatório de origem.</>
                                                    : <>Por padrão, apenas você vê esta peça. Libere para que o profissional responsável pelo relatório também possa visualizá-la.</>
                                                }
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleShare(selectedNFT)}
                                                    disabled={togglingShareId === selectedNFT.id}
                                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                                                        selectedNFT.shared_with_professional
                                                            ? 'bg-emerald-500/80'
                                                            : 'bg-slate-700'
                                                    }`}
                                                    role="switch"
                                                    aria-checked={!!selectedNFT.shared_with_professional}
                                                    aria-label="Permitir visualização clínica"
                                                >
                                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                                        selectedNFT.shared_with_professional ? 'translate-x-5' : 'translate-x-1'
                                                    }`} />
                                                </button>
                                                <span className="text-[10px] text-slate-500">
                                                    {selectedNFT.shared_with_professional && selectedNFT.shared_at
                                                        ? `Liberado em ${new Date(selectedNFT.shared_at).toLocaleDateString('pt-BR')}`
                                                        : 'Apenas você vê'
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal footer actions */}
                        <div className="px-4 py-2.5 border-t border-slate-700 bg-slate-800/30 flex items-center justify-end gap-2 flex-shrink-0">
                            <button
                                onClick={() => setSelectedNFT(null)}
                                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                Fechar
                            </button>
                            {selectedNFT.report_id && (
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors shadow-lg shadow-emerald-500/20"
                                    onClick={() => {
                                        // V1.9.197: navegar de fato pro report origem
                                        // Usa query string ?section=relatorio que PatientDashboard
                                        // detecta e abre report-detail tab
                                        const reportId = selectedNFT.report_id
                                        setSelectedNFT(null)
                                        navigate(`/app/clinica/paciente/dashboard?section=relatorio&report=${reportId}`)
                                    }}
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver relatório origem
                                    <ArrowUpRight className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
