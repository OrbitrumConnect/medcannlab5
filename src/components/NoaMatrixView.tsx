/**
 * NoaMatrixView — view dedicada Nôa Matrix no Terminal de Pesquisa.
 *
 * V1.9.379-D — Integração final Fase 1.
 *
 * Layout 2 colunas (lg+):
 *  - ESQUERDA: cards anexáveis (Casos Similares marcados + Notas Rápidas)
 *  - DIREITA: ResearchChat (V1.9.379-C) com attachedContext composto
 *
 * Atrito intencional (Material A Pedro+Ricardo):
 *  - Cards começam não-selecionados
 *  - Médico marca explicitamente quais quer "trazer pro chat"
 *  - Contexto só é injetado quando médico confirma seleção
 *  - Toggle visual claro entre "marcado" e "não-marcado"
 *
 * Reusa:
 *  - useSearchHistory (V1.9.364/365 — caseOpens, notes, pinned)
 *  - ResearchChat (V1.9.379-C)
 *  - useResearchChat (hook bypassFSM)
 *
 * Princípios cristalizados aplicados:
 *  - feedback_publicacao_nao_e_exploracao_interna_18_05 (chat estrutura, médico decide)
 *  - feedback_limitar_autoridade_computacional_19_05 (Z2 only, sem síntese clínica)
 *  - polir-não-inventar (reusa hooks/componentes existentes)
 */
import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { usePatientLongitudinal } from '../hooks/usePatientLongitudinal'
import { useExternalLiterature } from '../hooks/useExternalLiterature'
import { useDossierPersist, type SavedDossier } from '../hooks/useDossierPersist'
import { useForumPublish } from '../hooks/useForumPublish'
import { useCaseSearch } from '../hooks/useCaseSearch'
import { formatPseudonymizedCaseBody } from '../lib/casePseudonymization'
import { EVIDENCE_LABELS } from '../services/pubmedService'
import { ResearchChat } from './ResearchChat'
import { exportDossierToPDF, type DossierMessage, type DossierData } from '../lib/dossierExport'
import { KnowledgeBaseIntegration, type KnowledgeDocument } from '../services/knowledgeBaseIntegration'
import { ANVISA_BULARIO_SEED, type BularioEntry } from '../data/anvisaBularioSeed'
import { Sparkles, FileText, StickyNote, Check, Info, Folder, User, Stethoscope, Activity, X, BookOpen, Search, Loader2, Archive, Trash2, Eye, GitBranch, Library, Send, Pill, Clock } from 'lucide-react'
import { MatrixHelpModal } from './MatrixHelpModal'

interface AttachableCard {
  id: string
  type: 'case' | 'note' | 'pinned-search' | 'patient-report' | 'patient-rationality' | 'patient-prior-dossier' | 'patient-follow-up' | 'pubmed-article' | 'kb-document' | 'bula-anvisa'
  title: string
  subtitle?: string
  body: string  // texto que vai pro contexto do chat
  timestamp?: number
  // V1.9.388-A.3 — link externo para o card visualmente clicável (PubMed PMID → URL)
  externalUrl?: string
}

const RATIONALITY_LABELS: Record<string, string> = {
  biomedical: 'Biomédica',
  traditional_chinese: 'MTC',
  ayurvedic: 'Ayurveda',
  homeopathic: 'Homeopatia',
  integrative: 'Integrativa',
}

// V1.9.395 (F2) — rótulo de contexto por tipo de card (cabeçalho enviado ao Edge).
const CTX_LABEL: Record<AttachableCard['type'], string> = {
  'case': 'CASO MARCADO',
  'note': 'NOTAS DO MÉDICO',
  'pinned-search': 'BUSCA FAVORITADA',
  'patient-report': 'RELATÓRIO DO PACIENTE',
  'patient-rationality': 'RACIONALIDADE APLICADA',
  // V1.9.483 (Camada 1.3 Matrix-Longitudinal) — dossiê prévio do mesmo paciente
  // como contexto de continuidade interpretativa. Snapshot imutável (só leitura).
  'patient-prior-dossier': 'DOSSIÊ ANTERIOR DESTE PACIENTE',
  // V1.9.489 (Camada 1.2 Matrix-Longitudinal) — evolução clínica escrita
  // pelo MÉDICO via Terminal "Nova Evolução" (clinical_assessments FOLLOW_UP).
  // Diferenciado de RELATÓRIO (AEC = clinical_reports) e de CHAT IA paciente.
  // Princípio meta 28/05: separação semântica > expansão de corpus.
  'patient-follow-up': 'EVOLUÇÃO CLÍNICA DO MÉDICO',
  'pubmed-article': 'PAPER PUBMED',
  'kb-document': 'DOCUMENTO DA BASE DE CONHECIMENTO',
  // [V1.9.468] (27/05/2026) — Bula ANVISA como material referenciável no corpus
  // marcado da Matrix. Médico marca manualmente (igual paper PubMed). Edge
  // RESEARCH_PROMPT contém bloco específico anti-síntese cross-bulas, anti-troca,
  // anti-inferência interação não-documentada (locks micro-factuais V1.9.453 +
  // princípio fronteira info farmacológica + bula infraestrutura cognitiva 27/05).
  'bula-anvisa': 'BULA ANVISA (REFERÊNCIA OFICIAL)',
}

// V1.9.482 (Pedro 28/05) — Categorias semânticas pra agrupar visibleCards no
// "Material disponível". Aplicação direta do princípio meta cristalizado 28/05
// (separação semântica entre fontes — memory feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05).
// ANTES: 7 tipos misturados num único grid → médico via dezenas de cards indistintos
// (anti-padrão Carolina: 39 reports + dossiês + papers + bulas tudo numa sopa).
// AGORA: cards agrupados visualmente por contexto clínico (paciente / pesquisa
// / memória). Headers entre grupos delimitam visualmente sem mudar estrutura
// do grid. Preparação preventiva pra Camada 1.2/1.3 (basta adicionar tipos
// novos no map CATEGORY_OF_TYPE). Zero refator estrutural.
type CardCategory = 'patient' | 'research' | 'memory'

const CATEGORY_OF_TYPE: Record<AttachableCard['type'], CardCategory> = {
  'patient-report': 'patient',
  'patient-rationality': 'patient',
  'patient-prior-dossier': 'patient',  // V1.9.483 — agrupa em "Contexto Paciente"
  'patient-follow-up': 'patient',      // V1.9.489 — evoluções FOLLOW_UP do médico
  'pubmed-article': 'research',
  'kb-document': 'research',
  'bula-anvisa': 'research',
  'case': 'memory',
  'note': 'memory',
  'pinned-search': 'memory',
}

const CATEGORY_LABEL: Record<CardCategory, string> = {
  patient: 'Contexto Paciente',
  research: 'Pesquisa',
  memory: 'Memória / Casos',
}

const CATEGORY_ORDER: CardCategory[] = ['patient', 'research', 'memory']

// V1.9.395 (F2) — teto de caracteres por doc anexado da Base de Conhecimento.
// Doc grande (ex: 618k chars no acervo atual) estouraria o TOKEN MGMT do Edge
// (cap 60k tokens). 8000 chars ~= 2k tokens — 3 docs anexados cabem folgado.
// Anexo MANUAL bounded (médico escolhe) — NÃO é o RAG automático
// (memory feedback_rag_molda_comportamento_cognitivo: nunca migrar pra base_conhecimento).
const MAX_DOC_CHARS = 8000

// V1.9.396 (F2) — placeholders de extração falha (gravados em documents.content
// pelo upload do Library quando OCR/parse não roda). Doc cujo texto é só isso
// não tem conteúdo aproveitável pra anexar — some da lista da Base de Conhecimento.
const DOC_CONTENT_PLACEHOLDERS = [
  'não foi possível extrair',
  'nenhum texto legível foi extraído',
  '[processando extração de texto',
  'não pôde extrair o texto',
]
// V1.9.402 — detecta conteúdo que é lixo binário de PDF (tabela xref gravada
// como "content" por extração falha no upload). Assinatura: várias entradas
// xref no formato "NNNNNNNNNN NNNNN n/f".
function looksLikePdfBinary(text: string): boolean {
  const xrefEntries = text.match(/\d{10} \d{5} [nf]\b/g)
  return !!xrefEntries && xrefEntries.length >= 3
}
function usableDocText(doc: KnowledgeDocument): string {
  const pick = (s: string) => {
    const t = (s || '').trim()
    if (!t) return ''
    const low = t.toLowerCase()
    if (DOC_CONTENT_PLACEHOLDERS.some((p) => low.includes(p))) return ''
    if (looksLikePdfBinary(t)) return ''
    return t
  }
  return pick(doc.content) || pick(doc.summary)
}

interface AttachedDoc {
  id: string
  title: string
  category: string
  author: string
  excerpt: string      // já truncado a MAX_DOC_CHARS no momento do anexo
  totalChars: number
}

export const NoaMatrixView: React.FC = () => {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  // V1.9.382 — patientId vindo do Terminal de Atendimento (trigger "Levar para Nôa Matrix")
  // Médico abre paciente em foco e clica botão pra trazer recortes longitudinais pro chat.
  // V1.9.446 — busca embutida (abaixo) também atualiza patientId via setSearchParams.
  const patientId = searchParams.get('patientId') || undefined
  const history = useSearchHistory(user?.id)
  const longitudinal = usePatientLongitudinal(patientId)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // V1.9.446 — busca embutida de paciente/caso (Pedro: unifica fluxo Casos
  // Similares → Matrix em 0 clique extra). Reusa useCaseSearch (mesma query
  // dupla de V1.9.445). Click em resultado: recordCaseOpen + setSearchParams
  // (atualiza patientId → longitudinal carrega → cards remontam).
  const caseSearch = useCaseSearch()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const handleCaseSearch = () => {
    if (searchTerm.trim().length < 3) return
    void caseSearch.search(searchTerm, 90)
  }
  const handleSelectSearchHit = (hit: import('../hooks/useCaseSearch').CaseSearchHit) => {
    history.recordCaseOpen({
      caseId: hit.reportId,
      patientId: hit.patientId,
      patientName: hit.patientName,
      queixa: hit.queixaPrincipal,
      // [V1.9.450] Passa conteúdo clínico pseudonimizado pra body rico do caso.
      // useCaseSearch.ts:128 já extraiu via extractPseudonymizedClinicalContent.
      // null se report sem content estruturado (cai pro fallback queixa-only).
      ...(hit.clinicalContent ? { clinicalContent: hit.clinicalContent } : {}),
    })
    // Atualiza URL preservando section (e qualquer outro param)
    const next = new URLSearchParams(searchParams)
    next.set('patientId', hit.patientId)
    setSearchParams(next, { replace: false })
    // Limpa lista de resultados pra reduzir ruído (busca fecha-se naturalmente)
    caseSearch.clear()
    setSearchTerm('')
    setSearchOpen(false)
  }
  // V1.9.386 — Pedro 19/05 noite: trigger ocultar cards pra não acumular
  // (não-destrutivo, só esconde da view atual; reload da sessão reseta)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())

  // [V1.9.454] Modal de ajuda elite ("Modo de uso profissional") acionado
  // pelo ícone (?) ao lado do título. Substitui bloco "Como funciona"
  // fixo do topo (visual mais limpo + conteúdo denso disponível on-demand).
  const [helpModalOpen, setHelpModalOpen] = useState(false)

  // V1.9.392 (F3-A.2) — Persistência de dossiês. Hook isolado, RLS por physician_id.
  const { saveDossier, listDossiers, deleteDossier, saving: dossierSaving } = useDossierPersist()
  const [savedDossiers, setSavedDossiers] = useState<SavedDossier[]>([])
  const [dossiersOpen, setDossiersOpen] = useState(false)
  const [dossierFeedback, setDossierFeedback] = useState<string | null>(null)
  // V1.9.481 (Camada 1.1 Matrix-Longitudinal — Ricardo 28/05): quando médico
  // fecha como dossiê SEM paciente em foco (sem ?patientId=X na URL), em vez
  // de salvar silenciosamente como órfão (caso empírico Ricardo 28/05 14:37:
  // dossier ecd67cf0 com patient_id=NULL → não aparece no prontuário), abrir
  // modal pra distinguir Pesquisa Livre vs Vincular paciente do acervo.
  // Princípio meta cristalizado 28/05: separação semântica > expansão de corpus.
  // Atrito intencional aplicado apenas no caso ambíguo (patientId existe → fluxo
  // zero-clique preservado). Resolve futuros dossiês; órfãos existentes ficam
  // como estão (decisão conservadora — Ricardo regenera).
  // Reusa caseSearch existente pra busca de paciente (princípio polir-não-inventar).
  const [pendingDossierContext, setPendingDossierContext] = useState<
    { dossierData: DossierData; fromRestore: boolean } | null
  >(null)
  const [contextSelectMode, setContextSelectMode] = useState<'choose' | 'select-patient'>('choose')
  const [contextSearchTerm, setContextSearchTerm] = useState('')
  // V1.9.393 (F3 reabrir dossiê) — pedido de restauração passado ao ResearchChat.
  // token = Date.now() a cada clique → reabrir o mesmo dossiê 2× dispara o efeito.
  const [restoreRequest, setRestoreRequest] = useState<
    { token: number; title: string; messages: DossierMessage[]; mode: 'review' | 'continue' } | null
  >(null)
  // V1.9.400 — snapshot do dossiê reaberto. Re-fechar uma sessão reaberta usa
  // o §1/§2 deste snapshot (a restauração V1.9.393 traz só a conversa, não o
  // corpus). Sem isto o novo PDF sairia com "Nenhum item marcado".
  const [restoredSnapshot, setRestoredSnapshot] = useState<DossierData | null>(null)

  // V1.9.403 (F4.2-A) — envio do dossiê ao Fórum (Caminho B): trigger + consent.
  const forumPublish = useForumPublish()
  const [publishTarget, setPublishTarget] = useState<SavedDossier | null>(null)
  const [publishAttested, setPublishAttested] = useState(false)
  // V1.9.437 — segundo atestado obrigatório (anti-vazamento de nome no conteúdo)
  const [publishNoNamesAttested, setPublishNoNamesAttested] = useState(false)

  const refreshDossiers = async () => {
    const list = await listDossiers(10)
    setSavedDossiers(list)
  }

  // V1.9.481 — Helper que executa o save real (extraído do callback onCloseDossier
  // original linhas ~1317-1335). Centraliza fluxo PDF + persistência + feedback
  // pra ser chamado tanto do fluxo normal (patientId existe / re-save snapshot)
  // quanto do modal V1.9.481 (médico escolheu Pesquisa Livre OU vinculou paciente).
  const performDossierSave = async (
    dossierData: DossierData,
    resolvedPatientId: string | null,
    fromRestore: boolean,
    isResaveSkip: boolean
  ) => {
    // F3-A.1 — gera PDF (sempre, mesmo se persistência falhar)
    exportDossierToPDF(dossierData)
    // V1.9.401 — re-fechar sessão reaberta SEM ter continuado a conversa
    // = mesma contagem de mensagens = só re-exportar PDF, NÃO cria dossiê novo.
    if (isResaveSkip) {
      setDossierFeedback('PDF re-gerado (sem alterações — dossiê não duplicado).')
      setTimeout(() => setDossierFeedback(null), 6000)
      return
    }
    // F3-A.2 — persiste snapshot no banco (RLS protege)
    const savedId = await saveDossier(dossierData, resolvedPatientId)
    if (savedId) {
      const msg = fromRestore
        ? 'Dossiê atualizado + PDF gerado.'
        : resolvedPatientId
          ? 'Dossiê vinculado ao paciente + PDF gerado.'
          : 'Dossiê salvo como Pesquisa Livre + PDF gerado.'
      setDossierFeedback(msg)
      refreshDossiers()
    } else {
      setDossierFeedback('PDF gerado. (Falha ao salvar no histórico — tente novamente.)')
    }
    setTimeout(() => setDossierFeedback(null), 6000)
  }

  // V1.9.388-A.3 — Reuso pubmedService V1.9.369 (princípio "polir não inventar").
  // Médico digita termo, vê papers, clica "anexar" → artigo vira card no attachedContext.
  // Hook ja tem debounce 400ms + cache 1h + AbortController.
  const literature = useExternalLiterature({ defaultYearsBack: 10 })
  const [pubmedOpen, setPubmedOpen] = useState(false)
  const [attachedPubmed, setAttachedPubmed] = useState<Array<{ pmid: string; title: string; authors: string[]; journal: string; pubdate: string; evidenceLevel: string; url: string }>>([])

  const attachPubmed = (article: typeof attachedPubmed[number]) => {
    setAttachedPubmed((prev) => prev.find((p) => p.pmid === article.pmid) ? prev : [...prev, article])
    setSelectedIds((prev) => new Set(prev).add(`pubmed-${article.pmid}`))
  }
  const detachPubmed = (pmid: string) => {
    setAttachedPubmed((prev) => prev.filter((p) => p.pmid !== pmid))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(`pubmed-${pmid}`)
      return next
    })
  }

  // [V1.9.468] (27/05/2026) — Bulário ANVISA anexável. Médico escolhe bulas do
  // seed estático (anvisaBularioSeed.ts, 118 entries) pra Matrix usar como
  // referência. Anexo MANUAL obrigatório (princípio Matrix Z2 não-diretivo —
  // memory feedback_matrix_z2_bula_como_material_marcado_nao_sintetizada_27_05).
  // SEED LOCAL, sem fetch (Bulário ANVISA SPA bloqueia Cloudflare — empírico 27/05).
  const [bularioOpen, setBularioOpen] = useState(false)
  const [bularioTerm, setBularioTerm] = useState('')
  const [attachedBulas, setAttachedBulas] = useState<BularioEntry[]>([])

  const attachBula = (entry: BularioEntry) => {
    setAttachedBulas((prev) => prev.find((b) => b.id === entry.id) ? prev : [...prev, entry])
    setSelectedIds((prev) => new Set(prev).add(`bula-${entry.id}`))
  }
  const detachBula = (id: string) => {
    setAttachedBulas((prev) => prev.filter((b) => b.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(`bula-${id}`)
      return next
    })
  }

  // V1.9.395 (F2) — Base de Conhecimento anexável. Médico escolhe docs internos
  // (public.documents via KnowledgeBaseIntegration — mesmo serviço da aba Library)
  // pra Matrix usar como contexto, igual ao PubMed. Anexo MANUAL, não RAG automático.
  const [kbOpen, setKbOpen] = useState(false)
  const [kbDocs, setKbDocs] = useState<KnowledgeDocument[]>([])
  const [kbLoading, setKbLoading] = useState(false)
  const [kbFilter, setKbFilter] = useState('')
  const [attachedDocs, setAttachedDocs] = useState<AttachedDoc[]>([])

  // Lazy load — só busca docs quando o médico abre o painel.
  const loadKbDocs = async () => {
    if (kbDocs.length > 0 || kbLoading) return
    setKbLoading(true)
    try {
      const all = await KnowledgeBaseIntegration.getAllDocuments()
      // Exclui quarentena LGPD + docs sem texto aproveitável (inclui placeholders
      // de extração falha — V1.9.396).
      const usable = all.filter((d) =>
        d.category !== 'cases_lgpd_quarantine' && usableDocText(d).length > 0)
      setKbDocs(usable)
    } catch (e) {
      console.warn('[NoaMatrix] erro ao carregar Base de Conhecimento:', e)
    } finally {
      setKbLoading(false)
    }
  }

  const attachDoc = (doc: KnowledgeDocument) => {
    const raw = usableDocText(doc)
    const excerpt = raw.length > MAX_DOC_CHARS ? raw.slice(0, MAX_DOC_CHARS) : raw
    setAttachedDocs((prev) => prev.find((d) => d.id === doc.id) ? prev : [...prev, {
      id: doc.id,
      title: doc.title || 'Documento sem título',
      category: doc.category || '—',
      author: doc.author || '—',
      excerpt,
      totalChars: raw.length,
    }])
    setSelectedIds((prev) => new Set(prev).add(`kb-${doc.id}`))
  }
  const detachDoc = (id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(`kb-${id}`)
      return next
    })
  }

  // V1.9.488 (Camada 1.4 Matrix-Longitudinal — Pedro 29/05) — toggles fonte
  // paciente. Antes: toda fonte longitudinal ligada sempre (médico sem controle).
  // Agora: 3 toggles compactos (AEC / Racionalidades / Dossiês prévios) preparam
  // infraestrutura pra Camada 1.2 (FOLLOW_UP) e fonte futura chat_interaction
  // (defaults ON nas existentes; Chat IA OFF por design quando entrar).
  // Princípio meta cristalizado 28/05: separação semântica > expansão de corpus.
  // Toggles só aparecem quando há patientId em foco (zero ruído sem paciente).
  type PatientSourceKey = 'reports' | 'rationalities' | 'priorDossiers' | 'evolucoes'
  const [patientSources, setPatientSources] = useState<Record<PatientSourceKey, boolean>>({
    reports: true,
    rationalities: true,
    priorDossiers: true,
    evolucoes: true,  // V1.9.489 — FOLLOW_UP do médico (Camada 1.2)
  })
  const togglePatientSource = (key: PatientSourceKey) => {
    setPatientSources((prev) => {
      const nextValue = !prev[key]
      // Quando médico desliga fonte, remove cards já marcados daquela fonte
      // (caso contrário ficariam em selectedIds invisíveis mas no contexto chat).
      // Match exato do prefixo de id por fonte (pr-rat-* prevalece sobre pr-* —
      // checagem na ordem certa abaixo).
      if (!nextValue) {
        const matchesSource = (id: string): boolean => {
          if (key === 'reports') return id.startsWith('pr-') && !id.startsWith('pr-rat-') && !id.startsWith('pr-dos-') && !id.startsWith('pr-fup-')
          if (key === 'rationalities') return id.startsWith('pr-rat-')
          if (key === 'priorDossiers') return id.startsWith('pr-dos-')
          return id.startsWith('pr-fup-')  // evolucoes
        }
        setSelectedIds((sel) => {
          const cleaned = new Set(sel)
          for (const id of Array.from(cleaned)) {
            if (matchesSource(id)) cleaned.delete(id)
          }
          return cleaned
        })
      }
      return { ...prev, [key]: nextValue }
    })
  }

  // Compor lista de cards anexáveis a partir de múltiplas fontes.
  // V1.9.379-D: localStorage (caseOpens + notes + pinned)
  // V1.9.382: + clinical_reports + clinical_rationalities do paciente em foco (longitudinal)
  // V1.9.488: + gate por patientSources (médico controla quais fontes longitudinais entram)
  const cards = useMemo<AttachableCard[]>(() => {
    const list: AttachableCard[] = []

    // V1.9.382 — Recortes longitudinais do paciente em foco (vindo do Terminal de Atendimento)
    // Aparecem PRIMEIRO porque são contexto explícito que o médico trouxe.
    // V1.9.384 — body usa pseudônimo (LGPD higiene). Médico vê nome real só no banner topo.
    const pseudonym = longitudinal.patientPseudonym ? `Paciente #${longitudinal.patientPseudonym}` : 'Paciente'
    if (patientSources.reports) longitudinal.reports.forEach((r) => {
      const dateStr = new Date(r.created_at).toLocaleDateString('pt-BR')
      // [V1.9.450-B] Quando clinicalContent presente (whitelist V1.9.450),
      // usa formatPseudonymizedCaseBody pra corpus rico (família + HDA +
      // hábitos + perguntas objetivas). Sem isso Matrix alucinava esses
      // dados — smoke empírico 25/05/2026 expôs 6 dados inventados.
      // Fallback (clinicalContent ausente): body legado V1.9.382 (queixa +
      // lista indiciária) — preservado pra compat retroativa.
      let body: string
      if (r.clinicalContent) {
        const caseIdShort = r.id.slice(-6)
        const richBody = formatPseudonymizedCaseBody(
          caseIdShort,
          dateStr,
          r.clinicalContent,
          r.mainComplaint,
        )
        // Prepend metadata do relatório (status + ICP) — não está no helper
        body = `Relatório clínico de ${pseudonym} (${dateStr})\nStatus: ${r.status}${r.signed_at ? ' (assinado ICP-Brasil)' : ''}\n\n${richBody}`
      } else {
        const lista = r.listaIndiciaria && r.listaIndiciaria.length > 0
          ? r.listaIndiciaria.filter(Boolean).join(', ')
          : ''
        body = `Relatório clínico de ${pseudonym} (${dateStr})\nStatus: ${r.status}${r.signed_at ? ' (assinado ICP-Brasil)' : ''}${r.mainComplaint ? `\nQueixa principal: "${r.mainComplaint}"` : ''}${lista ? `\nLista indiciária: ${lista}` : ''}`
      }
      list.push({
        id: `pr-${r.id}`,
        type: 'patient-report',
        title: `Relatório de ${dateStr}`,
        subtitle: `${r.status}${r.signed_at ? ' · ICP' : ''}`,
        body,
        timestamp: new Date(r.created_at).getTime(),
      })
    })

    if (patientSources.rationalities) longitudinal.rationalities.forEach((r) => {
      const dateStr = new Date(r.created_at).toLocaleDateString('pt-BR')
      const label = RATIONALITY_LABELS[r.rationality_type] || r.rationality_type
      list.push({
        id: `pr-rat-${r.id}`,
        type: 'patient-rationality',
        title: `Racionalidade ${label} (${dateStr})`,
        subtitle: r.rationality_type,
        body: `Racionalidade ${label} aplicada a ${pseudonym} em ${dateStr}${r.assessmentExcerpt ? `\nRecorte: "${r.assessmentExcerpt}..."` : ''}`,
        timestamp: new Date(r.created_at).getTime(),
      })
    })

    // V1.9.483 (Camada 1.3 Matrix-Longitudinal) — dossiês prévios do MESMO paciente.
    // Continuidade interpretativa do caso (Ricardo 28/05: "Matrix puxar continuidade
    // do estudo pelo prontuário"). Snapshot imutável (id, título, data, contadores
    // + snippet primeira msg médico). Card agrupa em "Contexto Paciente" via
    // CATEGORY_OF_TYPE V1.9.482. Default não-marcado (atrito intencional V1.9.382).
    // V1.9.489 (Camada 1.2 Matrix-Longitudinal — Pedro 29/05) — evoluções
    // escritas pelo MÉDICO via Terminal "Nova Evolução" (FOLLOW_UP). Fonte
    // separada de AEC (clinical_reports IA Residente). Body inclui excerto
    // pseudonimizado (pseudônimo já aplicado via patientPseudonym; conteúdo
    // CRU pode ainda ter PII — mitigação V1.9.452 backlog endereça em massa).
    // Aparece em "Contexto Paciente" via CATEGORY_OF_TYPE V1.9.489.
    if (patientSources.evolucoes) longitudinal.followUps.forEach((f) => {
      const dateStr = new Date(f.created_at).toLocaleDateString('pt-BR')
      const excerpt = f.contentExcerpt ? `\nRecorte: "${f.contentExcerpt}..."` : ''
      list.push({
        id: `pr-fup-${f.id}`,
        type: 'patient-follow-up',
        title: `Evolução de ${dateStr}`,
        subtitle: f.status,
        body: `Evolução clínica escrita pelo médico sobre ${pseudonym} (${dateStr})\nStatus: ${f.status}${excerpt}`,
        timestamp: new Date(f.created_at).getTime(),
      })
    })

    if (patientSources.priorDossiers) longitudinal.priorDossiers.forEach((d) => {
      const dateStr = new Date(d.generated_at).toLocaleDateString('pt-BR')
      const cardsLabel = d.cardsCount === 1 ? '1 card' : `${d.cardsCount} cards`
      const msgsLabel = d.messagesCount === 1 ? '1 msg' : `${d.messagesCount} msgs`
      list.push({
        id: `pr-dos-${d.id}`,
        type: 'patient-prior-dossier',
        title: `Dossiê de ${dateStr}`,
        subtitle: `${cardsLabel} · ${msgsLabel}`,
        body: `Dossiê prévio sobre ${pseudonym} (${dateStr})\n${cardsLabel} marcados · ${msgsLabel} no chat${d.snippet ? `\nPrimeira reflexão do médico: "${d.snippet}..."` : ''}`,
        timestamp: new Date(d.generated_at).getTime(),
      })
    })

    // V1.9.379-D — Casos abertos (até 12 mais recentes)
    // V1.9.450 — body agora formata seções clínicas estruturadas pseudonimizadas
    // (queixa + lista indiciária + HDA + história familiar + hábitos + perguntas
    // objetivas) via formatPseudonymizedCaseBody. Matrix Z2 deixa de responder
    // "não há dados" quando médico pergunta sobre família/lista indiciária —
    // passa a ter corpus rico pra responder substantivamente preservando voz Z2
    // e pseudonimização ("Caso #X" sem nome real).
    history.caseOpens.slice(0, 12).forEach((c) => {
      const dateStr = new Date(c.ts).toLocaleDateString('pt-BR')
      const caseIdShort = c.caseId.slice(-6)
      list.push({
        id: `case-${c.caseId}`,
        type: 'case',
        title: c.patientName || 'Paciente sem nome',
        subtitle: dateStr,
        // V1.9.407 (LGPD) — body NÃO leva patientName: o body vai pro contexto da
        // Matrix → síntese do dossiê → conteúdo do forum_post (visível a outros
        // profissionais). O nome real fica só no `title` (UI do médico). O `Caso #`
        // já é o identificador pseudonimizado.
        // V1.9.450 — body usa formatPseudonymizedCaseBody quando c.clinicalContent
        // está presente (case marcado via V1.9.450+). Cai pro formato legado
        // (Caso #X + Queixa) quando ausente (cases antigos do localStorage).
        body: formatPseudonymizedCaseBody(
          caseIdShort,
          dateStr,
          c.clinicalContent ?? null,
          c.queixa,
        ),
        timestamp: c.ts,
      })
    })

    // Notas (1 bloco grande se não-vazio)
    if (history.notes && history.notes.trim().length > 0) {
      list.push({
        id: 'note-scratchpad',
        type: 'note',
        title: 'Suas notas rápidas',
        subtitle: `${history.notes.length} caracteres`,
        body: `Notas do médico:\n${history.notes.trim()}`,
      })
    }

    // Buscas favoritadas (pinned) — até 6 mais recentes
    history.pinned.slice(0, 6).forEach((p) => {
      list.push({
        id: `pinned-${p.ts}`,
        type: 'pinned-search',
        title: `"${p.term}"`,
        subtitle: `${p.rationality === 'all' ? 'Todas racionalidades' : p.rationality} · ${p.period}d`,
        body: `Busca favoritada: termo "${p.term}", filtro ${p.rationality}, últimos ${p.period} dias`,
        timestamp: p.ts,
      })
    })

    // V1.9.388-A.3 — Papers PubMed anexados pelo médico (reuso pubmedService V1.9.369)
    attachedPubmed.forEach((a) => {
      const authorsShort = a.authors.slice(0, 3).join(', ') + (a.authors.length > 3 ? ' et al.' : '')
      const evidenceLabel = EVIDENCE_LABELS[a.evidenceLevel as keyof typeof EVIDENCE_LABELS] || a.evidenceLevel
      list.push({
        id: `pubmed-${a.pmid}`,
        type: 'pubmed-article',
        title: a.title,
        subtitle: `PMID ${a.pmid} · ${a.journal} · ${a.pubdate} · ${evidenceLabel}`,
        body: `Paper PubMed (PMID ${a.pmid})\nTítulo: ${a.title}\nAutores: ${authorsShort}\nRevista: ${a.journal}\nData: ${a.pubdate}\nNível de evidência: ${evidenceLabel}\nURL: ${a.url}`,
        externalUrl: a.url,
      })
    })

    // V1.9.395 (F2) — Documentos da Base de Conhecimento anexados pelo médico.
    attachedDocs.forEach((d) => {
      const truncNote = d.totalChars > d.excerpt.length
        ? `\n[... documento truncado — ${d.totalChars} caracteres no total, ${d.excerpt.length} anexados]`
        : ''
      list.push({
        id: `kb-${d.id}`,
        type: 'kb-document',
        title: d.title,
        subtitle: `Base de Conhecimento · ${d.category}`,
        body: `Documento da Base de Conhecimento\nTítulo: ${d.title}\nCategoria: ${d.category} · Autor: ${d.author}\nConteúdo:\n${d.excerpt}${truncNote}`,
      })
    })

    // [V1.9.468] (27/05/2026) — Bulas ANVISA marcadas pelo médico (seed estático).
    // Body inclui METADADOS estruturais (nome + princípio ativo + apresentação +
    // tarja + indicação resumida + observação curada + link bula completa).
    // NÃO inclui posologia/contraindicações/interações detalhadas — médico clica
    // no link e lê bula original ANVISA. Sistema é REFERÊNCIA, não substituto.
    // Princípios aplicados:
    //   feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05
    //   feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05
    //   feedback_matrix_z2_bula_como_material_marcado_nao_sintetizada_27_05
    attachedBulas.forEach((b) => {
      const tarjaLabel = b.tarja ? `tarja ${b.tarja}` : 'tarja não especificada'
      const obs = b.observacao ? `\nObservação clínica curada: ${b.observacao}` : ''
      list.push({
        id: `bula-${b.id}`,
        type: 'bula-anvisa',
        title: `${b.nomeComercial} (${b.principioAtivo})`,
        subtitle: `${b.classeTerapeutica} · ${tarjaLabel} · ${b.laboratorio}`,
        body: `Bula ANVISA (${b.nomeComercial})\nPrincípio ativo: ${b.principioAtivo}\nApresentação: ${b.apresentacao}\nClasse terapêutica: ${b.classeTerapeutica}\nLaboratório: ${b.laboratorio}\nTarja: ${b.tarja || 'não especificada'}\nIndicação resumida: ${b.indicacaoResumida}${obs}\nBulário oficial ANVISA: ${b.bularioUrl}`,
        externalUrl: b.bularioUrl,
      })
    })

    return list
  }, [history.caseOpens, history.notes, history.pinned, longitudinal.reports, longitudinal.rationalities, longitudinal.priorDossiers, longitudinal.followUps, attachedPubmed, attachedDocs, attachedBulas, patientSources])

  const toggleCard = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // V1.9.386 — Ocultar card da view.
  // V1.9.444 — Cards do tipo `case` agora também removem do histórico persistido
  // (localStorage caseOpens) via removeCaseOpen — o ✕ vira ação definitiva pra
  // casos que vieram de Casos Similares, em vez de ocultação volátil que reload
  // restaurava. Outros tipos (note/pinned/longitudinal/pubmed/kb) seguem com
  // ocultação só-sessão porque vêm de fontes que o médico controla por outras
  // vias (notes editáveis, pinned tem unpin, longitudinal vem do paciente em foco,
  // pubmed/kb tem detach próprio).
  const hideCard = (id: string) => {
    if (id.startsWith('case-')) {
      const caseId = id.slice('case-'.length)
      history.removeCaseOpen(caseId)
    }
    setHiddenIds((prev) => new Set(prev).add(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)  // Se estava marcado, desmarca antes de ocultar
      return next
    })
  }

  // Cards visíveis (não-ocultos)
  const visibleCards = useMemo(() => cards.filter((c) => !hiddenIds.has(c.id)), [cards, hiddenIds])

  // Compor contexto pra passar pro ResearchChat.
  const attachedContext = useMemo(() => {
    if (selectedIds.size === 0) return ''
    const selected = cards.filter((c) => selectedIds.has(c.id))
    return selected
      .map((c) => `[${CTX_LABEL[c.type]}]\n${c.body}`)
      .join('\n\n---\n\n')
  }, [selectedIds, cards])

  const selectedCount = selectedIds.size

  // V1.9.395 (F2) — lista da Base de Conhecimento filtrada client-side (por título).
  const kbVisible = kbFilter.trim()
    ? kbDocs.filter((d) => (d.title || '').toLowerCase().includes(kbFilter.trim().toLowerCase()))
    : kbDocs

  return (
    <div className="space-y-3">
      {/* V1.9.494 (Pedro 29/05 ~15h) — ORDEM INVERTIDA: identidade Matrix vem
          primeiro (default reading order natural feature-first), contexto
          paciente vem depois. ANTES (V1.9.493): banner amber em cima → header
          Matrix embaixo (anti-hierarquia: contexto paciente sobre identidade
          do produto). DEPOIS: header Matrix → banner amber → timeline 1.6.
          Plus: banner amber compactado ainda mais (User icon w-3, LGPD inline
          com #code, removido separador "·" entre #code e pills). */}

      {/* Header da view — V1.9.485 (Pedro 28/05) compactado pra liberar espaço
          vertical (especialmente mobile). V1.9.494 (29/05): movido pro TOPO. */}
      <div className="bg-slate-900/40 border border-purple-500/20 rounded-xl p-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-300" />
            </div>
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="truncate">🧬 Nôa Matrix</span>
              <span className="text-[10px] font-normal text-purple-300/70 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 flex-shrink-0">
                Z2 estrutural
              </span>
              {/* [V1.9.454] Botão tutorial — abre MatrixHelpModal com modo de uso elite.
                  V1.9.485-A (Pedro 28/05): "?" trocado por texto "Modo de uso" pra
                  comunicar diretamente o que o botão faz (anti-icon-ambiguity).
                  Ícone Info compacto preserva affordance visual. */}
              <button
                type="button"
                onClick={() => setHelpModalOpen(true)}
                className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-purple-300/80 hover:text-purple-200 hover:bg-purple-500/10 rounded-full border border-purple-500/20 hover:border-purple-500/40 transition-colors flex-shrink-0"
                title="Como usar a Nôa Matrix"
                aria-label="Abrir modo de uso"
              >
                <Info className="w-3 h-3" />
                <span>Modo de uso</span>
              </button>
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
            <Folder className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-slate-400">
              {selectedCount === 0 ? 'Nenhum item marcado' : `${selectedCount} item${selectedCount === 1 ? '' : 'ns'} no chat`}
            </span>
          </div>
        </div>
      </div>

      {/* [V1.9.454] Modal de modo de uso profissional */}
      <MatrixHelpModal isOpen={helpModalOpen} onClose={() => setHelpModalOpen(false)} />

      {/* V1.9.494 — banner amber compactado MAX: User w-3, #6ACF(LGPD) inline,
          sem separador "·" antes dos pills, pills sem mudanças (já compactos
          V1.9.493). Loading/erro inline ml-auto. ~32px → ~26-28px reais. */}
      {patientId && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-2.5 py-1 flex items-center gap-1.5 flex-wrap">
          <User className="w-3 h-3 text-amber-300 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-amber-200 min-w-0 truncate">
            {longitudinal.patientName || 'Paciente'}
          </span>
          {longitudinal.patientPseudonym && (
            <span className="text-[9px] font-mono text-amber-300/70 flex-shrink-0">
              <strong>#{longitudinal.patientPseudonym}</strong> <span className="text-amber-300/40">(LGPD)</span>
            </span>
          )}
          {!longitudinal.loading && !longitudinal.error && ([
            { key: 'reports' as const, label: 'AEC', icon: Stethoscope, count: longitudinal.reports.length },
            { key: 'evolucoes' as const, label: 'Evol', icon: GitBranch, count: longitudinal.followUps.length },
            { key: 'rationalities' as const, label: 'Rac', icon: Activity, count: longitudinal.rationalities.length },
            { key: 'priorDossiers' as const, label: 'Dos', icon: Archive, count: longitudinal.priorDossiers.length },
          ]).map(({ key, label, icon: Icon, count }) => {
            const active = patientSources[key]
            return (
              <button
                key={key}
                type="button"
                onClick={() => togglePatientSource(key)}
                disabled={count === 0}
                className={`flex items-center gap-0.5 px-1.5 py-0 rounded-full text-[9px] border transition-colors ${
                  count === 0
                    ? 'bg-slate-900/40 border-slate-700/30 text-slate-600 cursor-not-allowed'
                    : active
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 hover:bg-amber-500/20'
                      : 'bg-slate-900/40 border-slate-700/40 text-slate-500 hover:border-amber-500/30 hover:text-slate-300'
                }`}
                title={count === 0 ? `Sem ${label === 'AEC' ? 'AEC' : label === 'Evol' ? 'evoluções' : label === 'Rac' ? 'racionalidades' : 'dossiês'} pra este paciente` : active ? `Desligar ${label}` : `Ligar ${label}`}
                aria-pressed={active}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{label}</span>
                <span className={active ? 'font-mono text-amber-300/80' : 'font-mono text-slate-500'}>·{count}</span>
              </button>
            )
          })}
          {longitudinal.loading && (
            <span className="text-[9px] text-amber-300/70 ml-auto flex-shrink-0">Carregando…</span>
          )}
          {longitudinal.error && (
            <span className="text-[9px] text-red-300 ml-auto flex-shrink-0 truncate">Erro: {longitudinal.error}</span>
          )}
        </div>
      )}

      {/* V1.9.493 (Pedro 29/05 Camada 1.6) — Mini-timeline cronológica. Condicional:
          só aparece quando médico marcou ≥2 cards do MESMO paciente (qualquer tipo
          patient-*). Mostra ORDEM TEMPORAL pura (data + queixa literal truncada),
          sem síntese, sem categorização, sem inferência. Anti-Camada 3 (Babylon
          Health $4.2B → 0 pattern). Médico vê o ritmo cronológico; interpretação
          é responsabilidade dele.

          Triagem 29/05 anti-GPT-externo: GPT externo propunha "extrair progressão
          corporal automaticamente" + "trajetória narrativa" = Camada 3 vetada.
          Camada 1.6 mostra APENAS: data + snippet literal + seta cronológica.
          Smoke 5/5 perguntas-armadilha:
          1. "Matrix está inferindo trajetória?" NÃO (só ordem temporal)
          2. "Categorização tipo 'progressão expansiva'?" NÃO
          3. "Inferência tipo 'dor migrou'?" NÃO (só data → data)
          4. "Sistema decide cards pertencem juntos?" NÃO (médico marcou)
          5. "Aparece sem médico marcar?" NÃO (gate ≥2)

          Reusa selectedIds + cards (zero query nova). Aplicação direta princípio
          meta 28/05 (separação semântica > expansão) + Z2 compressão estrutural
          permitida (datas+citação literal = fato; não-interpretativo). */}
      {patientId && (() => {
        const patientCards = cards.filter(
          (c) => selectedIds.has(c.id) && c.type.startsWith('patient-') && typeof c.timestamp === 'number'
        )
        if (patientCards.length < 2) return null
        // Agrupa por data (formato pt-BR) — múltiplos cards mesmo dia = "28/05(2)"
        const sorted = [...patientCards].sort((a, b) => (a.timestamp! - b.timestamp!))
        const grouped = new Map<string, { dateStr: string; count: number; snippet: string; type: string }>()
        for (const c of sorted) {
          const d = new Date(c.timestamp!)
          const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          const key = dateStr
          // Snippet: extrai 1ª linha do body OU subtitle (truncado ~20 chars)
          const firstLine = (c.body || '').split('\n')[0] || c.subtitle || c.title
          const cleanSnippet = firstLine.replace(/^Relatório clínico de [^(]+\([^)]+\)\s*/i, '').replace(/^Racionalidade [^a]+aplicada a [^e]+em [^\n]+/i, c.subtitle || '').trim().slice(0, 22)
          if (grouped.has(key)) {
            const existing = grouped.get(key)!
            existing.count += 1
          } else {
            grouped.set(key, { dateStr, count: 1, snippet: cleanSnippet, type: c.type })
          }
        }
        const entries = Array.from(grouped.values())
        return (
          <div className="bg-slate-900/40 border border-emerald-500/15 rounded-xl px-3 py-1.5 flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3 h-3 text-emerald-300 flex-shrink-0" />
            <span className="text-[10px] uppercase tracking-wide text-emerald-300/70 font-semibold flex-shrink-0">
              {patientCards.length} marcados:
            </span>
            {entries.map((entry, idx) => (
              <React.Fragment key={entry.dateStr}>
                <span className="flex items-center gap-1 text-[10px]">
                  <span className="font-mono text-emerald-200">
                    {entry.dateStr}{entry.count > 1 ? `(${entry.count})` : ''}
                  </span>
                  {entry.snippet && entry.count === 1 && (
                    <span className="text-slate-400 italic truncate max-w-[140px]">
                      "{entry.snippet}"
                    </span>
                  )}
                </span>
                {idx < entries.length - 1 && (
                  <span className="text-emerald-500/40 flex-shrink-0">→</span>
                )}
              </React.Fragment>
            ))}
            <span className="text-[9px] text-emerald-300/40 ml-auto flex-shrink-0 italic">
              ordem cronológica · sem interpretação
            </span>
          </div>
        )
      })()}

      {/* V1.9.494 — Header Matrix + modal MOVIDOS pro topo do return (linhas ~679).
          Antes ficavam aqui (embaixo do banner amber) violando hierarquia de leitura.
          Agora identidade Matrix vem PRIMEIRO; contexto paciente vem DEPOIS. */}

      {/* Grid: cards (esquerda) + chat (direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cards anexáveis */}
        <div className="lg:col-span-5 space-y-3">

          {/* V1.9.446 — Busca embutida paciente/caso (unifica Casos Similares → Matrix).
              Mesmo padrão visual dos painéis PubMed/Base de Conhecimento (colapsável,
              borda emerald). Click em resultado: atualiza patientId via setSearchParams,
              longitudinal recarrega, cards remontam. */}
          <div className="bg-slate-900/40 border border-emerald-500/30 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-emerald-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-slate-200">Buscar paciente ou caso</span>
              </div>
              <span className="text-[10px] text-slate-500">{searchOpen ? 'fechar' : 'expandir'}</span>
            </button>

            {searchOpen && (
              <div className="border-t border-emerald-500/20 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleCaseSearch() }}
                      placeholder='ex: "Carolina", "dor lombar"'
                      className="w-full bg-slate-800/60 border border-emerald-500/20 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCaseSearch}
                    disabled={caseSearch.loading || searchTerm.trim().length < 3}
                    className="text-[10px] px-2 py-1.5 rounded bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    {caseSearch.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'buscar'}
                  </button>
                </div>

                {caseSearch.error && (
                  <div className="text-[10px] text-red-300">{caseSearch.error}</div>
                )}

                {!caseSearch.loading && caseSearch.results.length === 0 && searchTerm.trim().length >= 3 && !caseSearch.error && (
                  <div className="text-[10px] text-slate-500 italic">Nenhum caso encontrado nos últimos 90 dias.</div>
                )}

                {caseSearch.results.length > 0 && (
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                    {caseSearch.results.map((hit) => (
                      <button
                        type="button"
                        key={hit.reportId}
                        onClick={() => handleSelectSearchHit(hit)}
                        className="w-full text-left rounded-md p-2 border border-slate-700/30 bg-slate-800/40 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-white truncate">{hit.patientName}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                              {hit.queixaPrincipal}
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-500 flex-shrink-0 mt-0.5">
                            {new Date(hit.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-start gap-1.5 text-[10px] text-slate-500 italic leading-tight pt-1 border-t border-slate-700/30">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Busca por nome do paciente ou termo da queixa (últimos 90d).
                    Click no resultado traz o paciente pro chat sem precisar abrir Casos Similares.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Material disponível
            </h3>
            {selectedCount > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[10px] text-slate-500 hover:text-emerald-300 transition-colors"
              >
                limpar seleção
              </button>
            )}
          </div>

          {visibleCards.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-6 text-center">
              <Folder className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-1">
                {hiddenIds.size > 0
                  ? `Todos os ${hiddenIds.size} itens foram ocultados nesta sessão.`
                  : 'Nenhum material marcado ainda.'}
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                {hiddenIds.size > 0 ? (
                  <button
                    onClick={() => setHiddenIds(new Set())}
                    className="text-purple-300 hover:text-purple-200 underline-offset-2 hover:underline"
                  >
                    Restaurar itens ocultos
                  </button>
                ) : (
                  <>
                    Abra casos em <strong className="text-purple-300">Casos Similares</strong>,
                    escreva notas no painel lateral e favorite buscas — depois volte aqui pra trazer ao chat.
                  </>
                )}
              </p>
            </div>
          ) : (
            <>
              {hiddenIds.size > 0 && (
                <div className="text-[10px] text-slate-500 flex items-center justify-between gap-2 px-1">
                  <span>{hiddenIds.size} item(ns) ocultado(s)</span>
                  <button
                    onClick={() => setHiddenIds(new Set())}
                    className="text-purple-300 hover:text-purple-200 underline-offset-2 hover:underline"
                  >
                    restaurar todos
                  </button>
                </div>
              )}
              {/* V1.9.389-C (Pedro 20/05 ~13h30) — altura reduzida 500→320 pra dividir
                  coluna esquerda 50/50 com bloco PubMed abaixo (anti-aglomeração).
                  V1.9.482 (Pedro 28/05) — separação semântica visual em 3 grupos
                  (Contexto Paciente / Pesquisa / Memória) via headers entre cards.
                  Container grid IDÊNTICO (max-h-[320px] preservado). Card individual
                  IDÊNTICO (click, select, hide, ícone — tudo intacto). Zero regressão
                  estrutural; apenas agrupamento visual. */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {(() => {
                  // V1.9.482 — agrupa visibleCards por categoria semântica
                  // preservando ordem dentro de cada grupo (input ja vem ordenado).
                  const grouped = new Map<CardCategory, AttachableCard[]>()
                  for (const cat of CATEGORY_ORDER) grouped.set(cat, [])
                  for (const card of visibleCards) {
                    const cat = CATEGORY_OF_TYPE[card.type]
                    if (cat) grouped.get(cat)!.push(card)
                  }
                  return CATEGORY_ORDER.map((cat) => {
                    const cards = grouped.get(cat) || []
                    if (cards.length === 0) return null
                    const CategoryIcon =
                      cat === 'patient' ? User :
                      cat === 'research' ? Search :
                      Folder
                    return (
                      <React.Fragment key={cat}>
                        {/* V1.9.482 — header semântico do grupo (não-clicável,
                            puramente visual). Compacto pra não roubar espaço
                            do grid 320px. */}
                        <div className="flex items-center gap-1.5 pt-2 first:pt-0 pb-0.5 pl-1 text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                          <CategoryIcon className="w-3 h-3 text-slate-500" />
                          <span>{CATEGORY_LABEL[cat]}</span>
                          <span className="text-slate-600 normal-case font-normal">· {cards.length}</span>
                        </div>
                        {cards.map((card) => {
                          const isSelected = selectedIds.has(card.id)
                          const Icon =
                            card.type === 'patient-report' ? Stethoscope :
                            card.type === 'patient-rationality' ? Activity :
                            card.type === 'patient-prior-dossier' ? Archive :  // V1.9.483 — dossier arquivado (snapshot imutável)
                            card.type === 'patient-follow-up' ? GitBranch :    // V1.9.489 — evolução longitudinal (médico escreveu)
                            card.type === 'case' ? FileText :
                            card.type === 'note' ? StickyNote :
                            card.type === 'pubmed-article' ? BookOpen :
                            card.type === 'kb-document' ? Library :
                            card.type === 'bula-anvisa' ? Pill :
                            Sparkles
                          return (
                            <div
                              key={card.id}
                              className={`relative rounded-lg p-3 border transition-all ${
                                isSelected
                                  ? 'bg-purple-500/15 border-purple-500/40 shadow-md shadow-purple-500/10'
                                  : 'bg-slate-900/40 border-slate-700/30 hover:border-purple-500/30 hover:bg-purple-500/5'
                              }`}
                            >
                              {/* V1.9.386 — Botão remover card.
                                  V1.9.444 — Casos vindos de "Casos Similares" agora
                                  são removidos do histórico persistido (não voltam
                                  após reload). Outros tipos seguem como ocultação
                                  de sessão. */}
                              <button
                                onClick={(e) => { e.stopPropagation(); hideCard(card.id) }}
                                className="absolute top-1.5 right-1.5 p-1 rounded text-slate-600 hover:text-red-300 hover:bg-red-500/10 transition-colors z-10"
                                title={card.type === 'case' ? 'Remover este caso do histórico' : 'Ocultar este item da lista (só nesta sessão)'}
                              >
                                <X className="w-3 h-3" />
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleCard(card.id)}
                                className="w-full text-left flex items-start gap-2.5 pr-5"
                              >
                                <div className={`mt-0.5 flex-shrink-0 p-1 rounded ${isSelected ? 'bg-purple-500/20' : 'bg-slate-800/60'}`}>
                                  {isSelected ? (
                                    <Check className="w-3 h-3 text-purple-300" />
                                  ) : (
                                    <Icon className="w-3 h-3 text-slate-500" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-white truncate">{card.title}</div>
                                  {card.subtitle && (
                                    <div className="text-[10px] text-slate-500 mt-0.5">{card.subtitle}</div>
                                  )}
                                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                    {card.body.split('\n').slice(0, 2).join(' · ')}
                                  </div>
                                </div>
                              </button>
                            </div>
                          )
                        })}
                      </React.Fragment>
                    )
                  })
                })()}
              </div>
            </>
          )}

          {/* V1.9.388-A.3 — Busca PubMed inline (reuso pubmedService V1.9.369)
              V1.9.389-C (Pedro 20/05 ~13h30 BRT) — Cores migradas purple → emerald-neon (anti-arco-íris).
              Memory feedback_clinical_cockpit_cor_por_estado_16_05: cor comunica estado/identidade
              consistente. Emerald = ação/CTA/MedCannLab brand. Purple fica só em identidade Matrix
              (header avatar). PubMed agora com altura igual ao Material disponível (split visual 50/50). */}
          <div className="bg-slate-900/40 border border-emerald-500/30 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setPubmedOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-emerald-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-slate-200">Buscar literatura PubMed</span>
                {attachedPubmed.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                    {attachedPubmed.length} anexado(s)
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">{pubmedOpen ? 'fechar' : 'expandir'}</span>
            </button>

            {pubmedOpen && (
              <div className="border-t border-emerald-500/20 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={literature.term}
                      onChange={(e) => literature.setTerm(e.target.value)}
                      placeholder="ex: cannabis chronic pain"
                      className="w-full bg-slate-800/60 border border-emerald-500/20 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  {literature.loading && <Loader2 className="w-3.5 h-3.5 text-emerald-300 animate-spin flex-shrink-0" />}
                </div>

                {literature.error && (
                  <div className="text-[10px] text-red-300">Erro: {literature.error}</div>
                )}

                {literature.articles.length === 0 && !literature.loading && literature.term.length > 2 && (
                  <div className="text-[10px] text-slate-500 italic">Nenhum paper encontrado.</div>
                )}

                {literature.articles.length > 0 && (
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                    {literature.articles.slice(0, 8).map((a) => {
                      const isAttached = attachedPubmed.some((p) => p.pmid === a.pmid)
                      const evidenceLabel = EVIDENCE_LABELS[a.evidenceLevel] || a.evidenceLevel
                      return (
                        <div
                          key={a.pmid}
                          className={`rounded-md p-2 border text-[11px] ${
                            isAttached
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-slate-800/40 border-slate-700/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <a
                                href={a.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-200 hover:underline font-medium line-clamp-2"
                                title={a.title}
                              >
                                {a.title}
                              </a>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {a.journal} · {a.pubdate} · {evidenceLabel}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => isAttached ? detachPubmed(a.pmid) : attachPubmed(a)}
                              className={`flex-shrink-0 text-[10px] px-2 py-1 rounded transition-colors ${
                                isAttached
                                  ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                                  : 'bg-slate-700/40 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-200'
                              }`}
                            >
                              {isAttached ? '✓ anexado' : '+ anexar'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-start gap-1.5 text-[10px] text-slate-500 italic leading-tight pt-1 border-t border-slate-700/30">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Busca direta no PubMed (NCBI). Anexar paper o coloca no contexto da Nôa Matrix
                    como card citável (PMID + título). Z2: ela referencia, não infere validade clínica.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* [V1.9.468] (27/05/2026) — Bulário ANVISA anexável. Mesmo padrão do PubMed:
              médico escolhe bulas do seed estático (anvisaBularioSeed.ts, 118 entries)
              pra Matrix usar como REFERÊNCIA FARMACOLÓGICA citável. SEED LOCAL — sem
              fetch (Bulário ANVISA SPA bloqueia Cloudflare empíricamente).
              Princípios cristalizados aplicados:
                feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05
                  (IA organiza acesso info oficial, NUNCA participa decisão terapêutica)
                feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05
                  (bula é infraestrutura cognitiva, decisão clínica é do médico)
                feedback_matrix_z2_bula_como_material_marcado_nao_sintetizada_27_05
                  (Matrix CITA LITERAL, NUNCA sintetiza cross-bulas, NUNCA sugere troca,
                   NUNCA infere interação não-documentada)
              Edge RESEARCH_PROMPT V1.9.468 contém bloco específico bulas (lock micro-factual). */}
          <div className="bg-slate-900/40 border border-emerald-500/30 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setBularioOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-emerald-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-slate-200">Bulário ANVISA BR</span>
                {attachedBulas.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                    {attachedBulas.length} anexada(s)
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">{bularioOpen ? 'fechar' : 'expandir'}</span>
            </button>

            {bularioOpen && (
              <div className="border-t border-emerald-500/20 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={bularioTerm}
                      onChange={(e) => setBularioTerm(e.target.value)}
                      placeholder="ex: cefalexina, cbd, gabapentina..."
                      className="w-full bg-slate-800/60 border border-emerald-500/20 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>

                {(() => {
                  const term = bularioTerm.trim().toLowerCase()
                  if (term.length < 2) {
                    return (
                      <div className="text-[10px] text-slate-500 italic">
                        Digite pelo menos 2 letras (nome comercial ou princípio ativo). Seed contém 118 bulas curadas.
                      </div>
                    )
                  }
                  const matches = ANVISA_BULARIO_SEED.filter((e) =>
                    e.nomeComercial.toLowerCase().includes(term) ||
                    e.principioAtivo.toLowerCase().includes(term) ||
                    e.classeTerapeutica.toLowerCase().includes(term)
                  ).slice(0, 8)
                  if (matches.length === 0) {
                    return <div className="text-[10px] text-slate-500 italic">Nenhuma bula encontrada no seed curado.</div>
                  }
                  return (
                    <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                      {matches.map((entry) => {
                        const isAttached = attachedBulas.some((b) => b.id === entry.id)
                        return (
                          <div
                            key={entry.id}
                            className={`rounded-md p-2 border text-[11px] ${
                              isAttached
                                ? 'bg-emerald-500/10 border-emerald-500/30'
                                : 'bg-slate-800/40 border-slate-700/30'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <a
                                  href={entry.bularioUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-200 hover:underline font-medium line-clamp-1"
                                  title={`${entry.nomeComercial} — ${entry.principioAtivo}`}
                                >
                                  {entry.nomeComercial}
                                </a>
                                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                                  {entry.principioAtivo} · {entry.classeTerapeutica}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {entry.apresentacao} · tarja {entry.tarja || 'n/e'} · {entry.laboratorio}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => isAttached ? detachBula(entry.id) : attachBula(entry)}
                                className={`flex-shrink-0 text-[10px] px-2 py-1 rounded transition-colors ${
                                  isAttached
                                    ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                                    : 'bg-slate-700/40 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-200'
                                }`}
                              >
                                {isAttached ? '✓ anexada' : '+ anexar'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}

                <div className="flex items-start gap-1.5 text-[10px] text-slate-500 italic leading-tight pt-1 border-t border-slate-700/30">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Seed curado ANVISA BR (118 bulas). Anexar bula coloca no contexto da Nôa Matrix
                    como REFERÊNCIA citável. Z2: ela cita literal — nunca compara cross-bulas, nunca
                    sugere troca, nunca infere interação não-documentada. Decisão terapêutica é do médico.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* V1.9.395 (F2) — Base de Conhecimento anexável. Mesmo padrão do PubMed:
              médico escolhe docs internos do acervo pra Matrix usar como contexto.
              Anexo MANUAL bounded (não RAG automático). Lazy load on expand.
              Memory feedback_rag_molda_comportamento_cognitivo: nunca migrar
              documents → base_conhecimento; anexo manual escolhido é seguro. */}
          <div className="bg-slate-900/40 border border-emerald-500/30 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const next = !kbOpen
                setKbOpen(next)
                if (next) loadKbDocs()
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-emerald-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Library className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-slate-200">Base de Conhecimento</span>
                {attachedDocs.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                    {attachedDocs.length} anexado(s)
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">{kbOpen ? 'fechar' : 'expandir'}</span>
            </button>

            {kbOpen && (
              <div className="border-t border-emerald-500/20 p-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={kbFilter}
                      onChange={(e) => setKbFilter(e.target.value)}
                      placeholder="Filtrar documentos por título..."
                      className="w-full bg-slate-800/60 border border-emerald-500/20 rounded-md pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                    />
                  </div>
                  {kbLoading && <Loader2 className="w-3.5 h-3.5 text-emerald-300 animate-spin flex-shrink-0" />}
                </div>

                {!kbLoading && kbDocs.length === 0 && (
                  <div className="text-[10px] text-slate-500 italic">Nenhum documento na Base de Conhecimento.</div>
                )}

                {kbVisible.length > 0 && (
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                    {kbVisible.map((d) => {
                      const isAttached = attachedDocs.some((a) => a.id === d.id)
                      const chars = usableDocText(d).length
                      return (
                        <div
                          key={d.id}
                          className={`rounded-md p-2 border text-[11px] ${
                            isAttached ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/40 border-slate-700/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-slate-200 font-medium line-clamp-2" title={d.title}>{d.title}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                                {d.category} · {chars > MAX_DOC_CHARS
                                  ? `${(chars / 1000).toFixed(0)}k caracteres (anexa trecho)`
                                  : `${chars} caracteres`}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => isAttached ? detachDoc(d.id) : attachDoc(d)}
                              className={`flex-shrink-0 text-[10px] px-2 py-1 rounded transition-colors ${
                                isAttached
                                  ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                                  : 'bg-slate-700/40 text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-200'
                              }`}
                            >
                              {isAttached ? '✓ anexado' : '+ anexar'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {!kbLoading && kbDocs.length > 0 && kbVisible.length === 0 && (
                  <div className="text-[10px] text-slate-500 italic">Nenhum documento bate com o filtro.</div>
                )}

                <div className="flex items-start gap-1.5 text-[10px] text-slate-500 italic leading-tight pt-1 border-t border-slate-700/30">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Documentos internos do acervo. Anexar coloca o conteúdo no contexto da Nôa Matrix
                    como card citável. Docs grandes entram truncados (trecho de {(MAX_DOC_CHARS / 1000).toFixed(0)}k caracteres).
                    Anexo manual — a Matrix não puxa documentos sozinha.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* V1.9.392 (F3-A.2) — Accordion "Meus Dossiês" — histórico persistido.
              Lazy load: lista só quando médico abre. RLS garante que só vê os próprios.
              Re-gerar PDF a partir do snapshot jsonb (não depende de estado atual do banco). */}
          <div className="bg-slate-900/40 border border-emerald-500/25 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                const next = !dossiersOpen
                setDossiersOpen(next)
                if (next) refreshDossiers()
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-emerald-500/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold text-slate-200">Meus Dossiês</span>
                {savedDossiers.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200">
                    {savedDossiers.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500">{dossiersOpen ? 'fechar' : 'expandir'}</span>
            </button>

            {dossiersOpen && (
              <div className="border-t border-emerald-500/20 p-3 space-y-2">
                {savedDossiers.length === 0 ? (
                  <p className="text-[10px] text-slate-500 italic">
                    Nenhum dossiê salvo ainda. Use "Fechar como dossiê" no chat pra gerar o primeiro.
                  </p>
                ) : (
                  savedDossiers.map((d) => (
                    <div
                      key={d.id}
                      className="rounded-md p-2 border bg-slate-800/40 border-slate-700/30 text-[11px]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-200 truncate">{d.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(d.generated_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {' · '}{d.content?.messages?.length ?? 0} msgs · {d.content?.selectedCards?.length ?? 0} cards
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* V1.9.393 (F3 reabrir dossiê) — Revisar = conversa em só-leitura */}
                          <button
                            type="button"
                            onClick={() => {
                              setRestoredSnapshot(d.content)
                              setRestoreRequest({
                                token: Date.now(),
                                title: d.title,
                                messages: d.content?.messages || [],
                                mode: 'review',
                              })
                            }}
                            title="Revisar a conversa deste dossiê no chat (somente leitura)"
                            className="p-1 rounded text-amber-300 hover:bg-amber-500/15 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* V1.9.393 — Continuar = sessão derivada editável (não altera o original) */}
                          <button
                            type="button"
                            onClick={() => {
                              setRestoredSnapshot(d.content)
                              setRestoreRequest({
                                token: Date.now(),
                                title: d.title,
                                messages: d.content?.messages || [],
                                mode: 'continue',
                              })
                            }}
                            title="Continuar a pesquisa a partir deste dossiê (sessão derivada)"
                            className="p-1 rounded text-purple-300 hover:bg-purple-500/15 transition-colors"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>
                          {/* V1.9.403 (F4.2-A) — Enviar dossiê ao Fórum (Caminho B) */}
                          <button
                            type="button"
                            onClick={() => { setPublishTarget(d); setPublishAttested(false); setPublishNoNamesAttested(false) }}
                            title="Enviar este dossiê ao Fórum (entra em análise do conselho)"
                            className="p-1 rounded text-cyan-300 hover:bg-cyan-500/15 transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              // Re-gera PDF a partir do snapshot imutável
                              const snap = d.content
                              exportDossierToPDF({ ...snap, generatedAt: new Date(snap.generatedAt) })
                            }}
                            title="Re-gerar PDF deste dossiê"
                            className="p-1 rounded text-emerald-300 hover:bg-emerald-500/15 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const ok = await deleteDossier(d.id)
                              if (ok) refreshDossiers()
                            }}
                            title="Remover dossiê do histórico"
                            className="p-1 rounded text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex items-start gap-1.5 text-[10px] text-slate-500 italic leading-tight pt-1 border-t border-slate-700/30">
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>
                    Dossiês são snapshots imutáveis da sessão. Visíveis apenas para você (RLS).
                    <strong className="text-amber-300"> Revisar</strong> abre a conversa em
                    só-leitura · <strong className="text-purple-300">Continuar</strong> deriva
                    uma sessão nova sem alterar o original · o ícone de documento re-gera o PDF.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* V1.9.392 — Feedback de salvamento de dossiê */}
          {dossierFeedback && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 flex items-center gap-2">
              {dossierSaving
                ? <Loader2 className="w-3.5 h-3.5 text-emerald-300 animate-spin flex-shrink-0" />
                : <Check className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />}
              <span className="text-[11px] text-emerald-200">{dossierFeedback}</span>
            </div>
          )}
        </div>

        {/* Chat */}
        {/* V1.9.402 — sticky: o chat fica fixo na tela enquanto os painéis da
            esquerda (PubMed / Base de Conhecimento) expandem e empurram a página */}
        <div className="lg:col-span-7 lg:sticky lg:top-4 lg:self-start">
          <ResearchChat
            attachedContext={attachedContext}
            restoreRequest={restoreRequest}
            // V1.9.390 (F3-A.1) → V1.9.392 (F3-A.2) — Callback "Fechar como dossiê".
            // F3-A.1: combina messages + cards + papers + identidade → exportDossierToPDF.
            // F3-A.2: ADICIONA persistência (saveDossier → physician_research_dossiers,
            //   snapshot imutável jsonb). Salva E gera PDF num clique. Memory:
            //   project_visao_final_eixo_pesquisa_19_05 F3 = fechar dossiê.
            onCloseDossier={async (matrixMessages: DossierMessage[], fromRestore: boolean) => {
              // V1.9.400 — re-fechar um dossiê reaberto (V1.9.393): a sessão
              // reaberta restaura só a CONVERSA, não o corpus. Quando fromRestore,
              // §1/§2 vêm do snapshot original; só a §3 (conversa) é atualizada.
              const snap = fromRestore ? restoredSnapshot : null
              const liveCards = cards
                .filter((c) => selectedIds.has(c.id))
                .map((c) => ({
                  id: c.id,
                  type: c.type,
                  title: c.title,
                  subtitle: c.subtitle,
                  body: c.body,
                  timestamp: c.timestamp,
                }))
              const dossierData: DossierData = {
                physicianName: (user as any)?.name || user?.email?.split('@')[0] || 'Médico',
                physicianEmail: user?.email || undefined,
                patientPseudonym: snap ? snap.patientPseudonym : (longitudinal.patientPseudonym || null),
                selectedCards: snap ? snap.selectedCards : liveCards,
                attachedPapers: snap ? snap.attachedPapers : attachedPubmed.map((p) => ({
                  pmid: p.pmid,
                  title: p.title,
                  authors: p.authors,
                  journal: p.journal,
                  pubdate: p.pubdate,
                  evidenceLevel: p.evidenceLevel,
                  url: p.url,
                })),
                messages: matrixMessages,
                generatedAt: new Date(),
              }
              // V1.9.401 check: re-save de snapshot sem mudanças → só PDF, sem insert.
              const isResaveSkip = !!(snap && matrixMessages.length === snap.messages.length)
              // V1.9.481 — INTERCEPTA: dossiê NOVO (não-snapshot) SEM patientId → modal
              // de confirmação Pesquisa Livre vs Vincular paciente. Atrito intencional
              // só no caso ambíguo; fluxo Terminal→Matrix (com patientId) zero-clique.
              if (!patientId && !snap && !isResaveSkip) {
                setPendingDossierContext({ dossierData, fromRestore })
                return
              }
              // Fluxo normal: patientId existe OU re-save snapshot (preserva V1.9.400/401)
              await performDossierSave(dossierData, patientId || null, fromRestore, isResaveSkip)
            }}
          />
        </div>
      </div>

      {/* V1.9.481 — modal "Vincular dossiê" quando fechar SEM patientId em foco.
          Disparado por onCloseDossier quando !patientId && !snap && !isResaveSkip.
          Atrito intencional: distinguir Pesquisa Livre vs Vincular paciente.
          Reusa caseSearch (princípio polir-não-inventar). */}
      {pendingDossierContext && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <GitBranch className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-white">Vincular dossiê</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Este dossiê não está vinculado a um paciente. Você pode salvá-lo como
                  <strong className="text-emerald-300"> Pesquisa Livre</strong> ou
                  <strong className="text-emerald-300"> vincular agora</strong> a um paciente do seu acervo.
                </p>
              </div>
            </div>

            {contextSelectMode === 'choose' && (
              <div className="space-y-2">
                <button
                  onClick={async () => {
                    const ctx = pendingDossierContext
                    setPendingDossierContext(null)
                    await performDossierSave(ctx.dossierData, null, ctx.fromRestore, false)
                  }}
                  disabled={dossierSaving}
                  className="w-full px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dossierSaving ? 'Salvando...' : 'Salvar como Pesquisa Livre'}
                </button>
                <button
                  onClick={() => {
                    caseSearch.clear()
                    setContextSearchTerm('')
                    setContextSelectMode('select-patient')
                  }}
                  disabled={dossierSaving}
                  className="w-full px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Vincular a um paciente
                </button>
                <button
                  onClick={() => {
                    setPendingDossierContext(null)
                    setContextSelectMode('choose')
                    setContextSearchTerm('')
                    caseSearch.clear()
                  }}
                  disabled={dossierSaving}
                  className="w-full px-4 py-2 text-slate-500 hover:text-slate-400 rounded text-xs transition-colors disabled:opacity-50"
                >
                  Cancelar (não salvar — PDF já foi gerado)
                </button>
              </div>
            )}

            {contextSelectMode === 'select-patient' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={contextSearchTerm}
                    onChange={(e) => setContextSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && contextSearchTerm.trim().length >= 3) {
                        void caseSearch.search(contextSearchTerm, 90)
                      }
                    }}
                    placeholder="Nome, queixa, código do paciente..."
                    className="flex-1 px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      if (contextSearchTerm.trim().length >= 3) {
                        void caseSearch.search(contextSearchTerm, 90)
                      }
                    }}
                    disabled={caseSearch.loading || contextSearchTerm.trim().length < 3}
                    className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {caseSearch.loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'buscar'}
                  </button>
                </div>
                {caseSearch.error && (
                  <p className="text-[11px] text-red-300">{caseSearch.error}</p>
                )}
                {!caseSearch.loading && caseSearch.results.length === 0 && contextSearchTerm.trim().length >= 3 && !caseSearch.error && (
                  <p className="text-[11px] text-slate-500">Nenhum paciente encontrado nos últimos 90 dias.</p>
                )}
                {caseSearch.results.length > 0 && (
                  <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-700/40 rounded p-1">
                    {caseSearch.results.map((hit) => (
                      <button
                        key={hit.reportId}
                        onClick={async () => {
                          const ctx = pendingDossierContext
                          setPendingDossierContext(null)
                          setContextSelectMode('choose')
                          setContextSearchTerm('')
                          caseSearch.clear()
                          await performDossierSave(ctx.dossierData, hit.patientId, ctx.fromRestore, false)
                        }}
                        disabled={dossierSaving}
                        className="w-full text-left px-3 py-2 bg-slate-800/40 hover:bg-slate-800/80 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <p className="text-sm text-white truncate">{hit.patientName || 'Paciente anônimo'}</p>
                        <p className="text-[11px] text-slate-500 truncate">{hit.queixaPrincipal || '—'}</p>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => {
                    setContextSelectMode('choose')
                    setContextSearchTerm('')
                    caseSearch.clear()
                  }}
                  disabled={dossierSaving}
                  className="text-xs text-slate-400 hover:text-slate-300 disabled:opacity-50"
                >
                  ← Voltar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* V1.9.403 (F4.2-A) — modal "Enviar ao Fórum" com atestação de consent */}
      {publishTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-2.5">
              <Send className="w-5 h-5 text-cyan-300 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white">Enviar dossiê ao Fórum</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{publishTarget.title}</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              O dossiê vai para <strong className="text-cyan-300">análise do conselho</strong>.
              Aprovado, vira debate no Fórum — visível a profissionais e admins. O paciente
              aparece pseudonimizado.
            </p>
            <label className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={publishAttested}
                onChange={(e) => setPublishAttested(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
              />
              <span>
                Atesto que o paciente consentiu que este caso, de forma pseudonimizada,
                seja discutido no fórum profissional do MedCannLab.
              </span>
            </label>
            {/* V1.9.437 — atestado anti-vazamento de nome no conteúdo */}
            <label className="flex items-start gap-2 text-[11px] text-slate-300 leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={publishNoNamesAttested}
                onChange={(e) => setPublishNoNamesAttested(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
              />
              <span>
                Atesto que revisei o conteúdo do dossiê e ele <strong className="text-cyan-300">não menciona nome real do paciente</strong>
                {' '}(nem em texto livre, nem em excertos de racionalidade).
              </span>
            </label>
            {forumPublish.error && (
              <div className="text-[11px] text-red-300">{forumPublish.error}</div>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setPublishTarget(null); setPublishAttested(false); setPublishNoNamesAttested(false) }}
                className="px-3 py-1.5 rounded-md text-[11px] text-slate-400 hover:text-slate-200 border border-slate-700/50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!publishAttested || !publishNoNamesAttested || forumPublish.publishing}
                onClick={async () => {
                  const target = publishTarget
                  if (!target) return
                  const ok = await forumPublish.publishDossier(target)
                  if (ok) {
                    setPublishTarget(null)
                    setPublishAttested(false)
                    setPublishNoNamesAttested(false)
                    setDossierFeedback('Dossiê enviado ao Fórum — em análise do conselho.')
                    setTimeout(() => setDossierFeedback(null), 6000)
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {forumPublish.publishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Publicar no Fórum</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
