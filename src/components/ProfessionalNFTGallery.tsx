/**
 * V1.9.311 — Galeria Clínica (médico)
 *
 * Espelho read-only da PatientNFTGallery. Médico vê NFTs que pacientes vinculados
 * liberaram explicitamente (shared_with_professional = true). RLS faz filtro:
 * "Professional sees only patient-shared NFTs" — esta query é segura mesmo sem
 * filtro client-side. Médico não pode mutar nem rejeitar — só visualiza.
 *
 * Filosofia (B-lite consent pattern):
 * - NFT é memorial/simbólico do paciente, NÃO anexo clínico operacional
 * - Médico só vê se paciente liberar (alinhado com referral consent V1.9.275)
 * - Sem botões de ação no médico — apenas contemplação
 *
 * Diferenças vs PatientNFTGallery:
 * - Sem create assessment (médico não cria)
 * - Sem toggle (médico não controla consent)
 * - Adiciona nome do paciente em cada card (médico precisa identificar)
 * - "X de Y" no header agora é "X peças liberadas de N pacientes"
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import {
    Sparkles, ChevronLeft, ChevronRight, X,
    Shield, Hash, Calendar, Palette, Eye,
    Loader2, ImageIcon, FileCheck, User as UserIcon,
    Stethoscope
} from 'lucide-react'

interface SharedNFT {
    id: string
    patient_id: string
    patient_name: string
    report_id: string
    image_url: string
    thumbnail_url: string | null
    image_hash: string
    signature_hash: string | null
    style: string
    emotional_sig: string | null
    palette: string[]
    symbols: string[]
    created_at: string
    shared_at: string | null
    // V1.9.311 — contexto clínico do report-pai (Pedro 16/05: "leve resumo
    // clínico não artístico"). Médico precisa identificar o momento clínico,
    // não só contemplar a estética. JOIN com clinical_reports.content.
    report_chief_complaint?: string | null
    report_clinical_score?: number | null
    report_created_at?: string | null
}

const PAGE_SIZE = 12

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

export default function ProfessionalNFTGallery() {
    const { user } = useAuth()
    const [nfts, setNfts] = useState<SharedNFT[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [page, setPage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [selectedNFT, setSelectedNFT] = useState<SharedNFT | null>(null)

    useEffect(() => {
        if (!user?.id) return

        const fetchNFTs = async () => {
            setLoading(true)
            try {
                const sb = supabase as any
                // RLS faz filtro: médico só vê NFTs onde shared_with_professional=true
                // E o report-pai pertence a ele (cr.professional_id OR doctor_id = auth.uid()).
                // JOIN com users pra trazer nome do paciente.
                const fromIdx = page * PAGE_SIZE
                const toIdx = fromIdx + PAGE_SIZE - 1

                const { count } = await sb
                    .from('patient_nfts')
                    .select('*', { count: 'exact', head: true })

                setTotalCount(count || 0)

                const { data, error } = await sb
                    .from('patient_nfts')
                    .select('id, patient_id, report_id, image_url, thumbnail_url, image_hash, signature_hash, style, emotional_sig, palette, symbols, created_at, shared_at, users:patient_id(name)')
                    .order('shared_at', { ascending: false, nullsFirst: false })
                    .range(fromIdx, toIdx)

                if (error) {
                    console.error('Error loading professional NFT gallery:', error)
                    setNfts([])
                } else {
                    // V1.9.311 — segunda query: enriquecer com contexto clínico do report-pai.
                    // Não dá pra JOIN direto na primeira (report_id em patient_nfts é text,
                    // pode ser UUID ou draft string tipo "report_1778..."). Fetch separado
                    // só pros que parecem UUID válido (drafts não têm row em clinical_reports).
                    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
                    const reportIds = (data || [])
                        .map((n: any) => n.report_id)
                        .filter((id: string) => id && uuidRegex.test(id))
                    let reportMap: Record<string, any> = {}
                    if (reportIds.length > 0) {
                        const { data: reports } = await sb
                            .from('clinical_reports')
                            .select('id, content, created_at')
                            .in('id', reportIds)
                        reportMap = Object.fromEntries(
                            (reports || []).map((r: any) => [r.id, r])
                        )
                    }

                    const mapped = (data || []).map((n: any) => {
                        const report = reportMap[n.report_id]
                        const content = report?.content as any
                        return {
                            id: n.id,
                            patient_id: n.patient_id,
                            patient_name: n.users?.name || 'Paciente',
                            report_id: n.report_id,
                            image_url: n.image_url,
                            thumbnail_url: n.thumbnail_url,
                            image_hash: n.image_hash,
                            signature_hash: n.signature_hash,
                            style: n.style,
                            emotional_sig: n.emotional_sig,
                            palette: n.palette,
                            symbols: n.symbols,
                            created_at: n.created_at,
                            shared_at: n.shared_at,
                            // Contexto clínico (pode vir null se report não-UUID ou sem campo)
                            report_chief_complaint:
                                content?.chief_complaint ??
                                content?.queixa_principal ??
                                content?.assessment?.chief_complaint ??
                                null,
                            report_clinical_score:
                                content?.scores?.clinical_score ??
                                content?.clinical_score ??
                                null,
                            report_created_at: report?.created_at || null,
                        }
                    })
                    setNfts(mapped as SharedNFT[])
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

    // Contagem de pacientes únicos com peças liberadas
    const uniquePatients = new Set(nfts.map(n => n.patient_id)).size

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
                            Galeria Clínica
                        </h1>
                        <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                            Assinaturas visuais que pacientes vinculados liberaram para visualização clínica.
                            Cada peça é derivada simbolicamente do conteúdo de um relatório clínico do paciente.
                            Liberação é controlada exclusivamente pelo paciente.
                        </p>
                    </div>
                </div>

                {!isEmpty && !loading && (
                    <div className="flex flex-wrap gap-3 mt-4 text-xs">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700">
                            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-300">{totalCount} {totalCount === 1 ? 'peça liberada' : 'peças liberadas'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700">
                            <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-slate-300">
                                {uniquePatients} {uniquePatients === 1 ? 'paciente' : 'pacientes'}
                            </span>
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

            {loading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
            )}

            {/* EMPTY STATE — médico, não paciente */}
            {isEmpty && (
                <div className="text-center py-16 px-6 bg-gradient-to-br from-slate-900/40 to-slate-800/20 rounded-2xl border border-slate-800">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Sparkles className="w-9 h-9 text-emerald-300/70" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                        Nenhuma peça liberada ainda
                    </h3>
                    <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                        Pacientes vinculados a você ainda não liberaram nenhuma assinatura visual
                        para visualização clínica. Quando liberarem, as peças aparecerão aqui com
                        identificação do paciente e contexto do relatório de origem.
                    </p>
                </div>
            )}

            {/* GRID */}
            {!loading && !isEmpty && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-4">
                        {nfts.map((nft) => {
                            const styleInfo = STYLE_LABELS[nft.style] || { label: nft.style, color: 'text-slate-300' }
                            return (
                                <button
                                    key={nft.id}
                                    onClick={() => setSelectedNFT(nft)}
                                    className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10"
                                    title={`${nft.patient_name} · ${formatDate(nft.created_at)}`}
                                >
                                    {nft.thumbnail_url || nft.image_url ? (
                                        <img
                                            src={getThumbnailUrl(nft.thumbnail_url || nft.image_url) || (nft.thumbnail_url || nft.image_url)}
                                            alt={`Assinatura visual ${nft.patient_name}`}
                                            loading="lazy"
                                            decoding="async"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                            <ImageIcon className="w-8 h-8 text-slate-600" />
                                        </div>
                                    )}
                                    {/* Overlay info — sempre visível pra médico identificar paciente */}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2">
                                        <div className="text-left">
                                            <div className="text-[11px] font-semibold text-white truncate">
                                                {nft.patient_name}
                                            </div>
                                            <div className="text-[9px] text-slate-300/80 truncate">
                                                {formatDate(nft.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Badge ICP no canto */}
                                    {nft.signature_hash ? (
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500/90 flex items-center justify-center" title="Ancorado em assinatura ICP-Brasil">
                                            <Shield className="w-3 h-3 text-white" />
                                        </div>
                                    ) : (
                                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500/80 flex items-center justify-center" title="Sem ancoragem criptográfica">
                                            <Hash className="w-3 h-3 text-white" />
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
                                <ChevronLeft className="w-4 h-4" /> Anterior
                            </button>
                            <div className="text-xs text-slate-400">
                                Página <span className="text-white font-semibold">{page + 1}</span> de{' '}
                                <span className="text-white font-semibold">{totalPages}</span>
                            </div>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-800/60 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-slate-300"
                            >
                                Próxima <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* MODAL — read-only, sem toggle, sem botão action */}
            {selectedNFT && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={() => setSelectedNFT(null)}
                    role="dialog"
                    aria-modal="true"
                    onKeyDown={(e) => { if (e.key === 'Escape') setSelectedNFT(null) }}
                >
                    <div
                        className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between bg-slate-800/50 flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                                <div>
                                    <h3 className="text-sm font-bold text-white">{selectedNFT.patient_name}</h3>
                                    <p className="text-[11px] text-slate-400">
                                        Liberado em {selectedNFT.shared_at ? formatDate(selectedNFT.shared_at) : '—'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNFT(null)}
                                className="p-1.5 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
                                aria-label="Fechar"
                                title="Fechar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-y-auto md:overflow-hidden custom-scrollbar">
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

                            <div className="p-4 md:p-5 md:overflow-y-auto custom-scrollbar space-y-3">
                                {/* Paciente + style */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="flex items-start gap-1.5">
                                        <UserIcon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Paciente</div>
                                            <div className="text-xs text-white font-medium truncate">{selectedNFT.patient_name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-1.5">
                                        <Palette className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Estilo</div>
                                            <div className="text-xs text-white font-medium truncate">
                                                {(STYLE_LABELS[selectedNFT.style])?.label || selectedNFT.style}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Emoção */}
                                {selectedNFT.emotional_sig && (
                                    <div className="flex items-start gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Emoção</div>
                                            <div className="text-xs text-white font-medium capitalize">{selectedNFT.emotional_sig}</div>
                                        </div>
                                    </div>
                                )}

                                {/*
                                  V1.9.311 — Bloco "Contexto Clínico" (Pedro 16/05):
                                  resumo clínico do report-pai pra médico identificar o momento
                                  clínico real, não só ler estética abstrata. JOIN feito no fetch.
                                  Se report não-UUID (draft, AEC abortada) ou sem campos esperados,
                                  bloco renderiza estado neutro "Sem contexto clínico estruturado".
                                */}
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold">
                                        <Stethoscope className="w-3 h-3" /> Contexto Clínico
                                    </div>
                                    {selectedNFT.report_chief_complaint || selectedNFT.report_clinical_score != null || selectedNFT.report_created_at ? (
                                        <div className="space-y-1.5 text-[10px]">
                                            {selectedNFT.report_chief_complaint && (
                                                <div>
                                                    <div className="text-[9px] text-slate-500 uppercase tracking-wide">Queixa Principal</div>
                                                    <div className="text-slate-200 leading-snug line-clamp-3">{selectedNFT.report_chief_complaint}</div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3 pt-0.5">
                                                {selectedNFT.report_clinical_score != null && (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-slate-500">Completude:</span>
                                                        <span className="text-emerald-300 font-semibold">{selectedNFT.report_clinical_score}/100</span>
                                                    </div>
                                                )}
                                                {selectedNFT.report_created_at && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-2.5 h-2.5 text-slate-500" />
                                                        <span className="text-slate-300">{formatDate(selectedNFT.report_created_at)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-500 italic">
                                            Sem contexto clínico estruturado (relatório de origem é draft ou foi gerado antes do schema atual).
                                        </p>
                                    )}
                                </div>

                                {/* Paleta */}
                                {selectedNFT.palette && selectedNFT.palette.length > 0 && (
                                    <div>
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-1">Paleta</div>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedNFT.palette.map((color, i) => (
                                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300 capitalize">{color}</span>
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

                                {/* Cadeia de confiança (read-only) */}
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-2.5 space-y-1.5">
                                    <div className="flex items-center gap-1.5 text-emerald-300 text-[11px] font-semibold">
                                        <Shield className="w-3 h-3" /> Cadeia de Confiança
                                    </div>
                                    <div className="space-y-1 text-[10px]">
                                        <div className="flex items-start gap-1.5">
                                            <Hash className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-slate-500">Hash imagem:</span>{' '}
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
                                                <span className="text-slate-500">Gerado:</span>{' '}
                                                <span className="text-slate-300">{formatDate(selectedNFT.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-1.5">
                                            <Eye className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                                            <div className="min-w-0 flex-1">
                                                <span className="text-slate-500">Liberado:</span>{' '}
                                                <span className="text-cyan-300">
                                                    {selectedNFT.shared_at ? formatDate(selectedNFT.shared_at) : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-2.5 border-t border-slate-700 bg-slate-800/30 flex items-center justify-end gap-2 flex-shrink-0">
                            <button
                                onClick={() => setSelectedNFT(null)}
                                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
