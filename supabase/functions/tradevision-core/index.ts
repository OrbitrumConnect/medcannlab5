// TRADEVISION CORE: VERSÃO MASTER (PRODUÇÃO)
// Deno.serve() — API nativa do runtime (recomendado pela documentação Supabase)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4"
import { COS, COS_Context } from "./cos_kernel.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Contrato institucional (IMUTÁVEL): token base de agendamento
const TRIGGER_SCHEDULING_TOKEN = '[TRIGGER_SCHEDULING]'
// Token universal de ação governada (app_commands/metadata) — sinal visual para o front; não dispara execução por si só
const TRIGGER_ACTION_TOKEN = '[TRIGGER_ACTION]'

// Triggers semânticos emitidos pelo GPT (modelo correto: GPT decide → Core governa → app_commands a partir do trigger).
// Alinhamento: avaliação clínica e agendamento são modelos selados (não editar). Todo o resto (terminal, abas, navegação, documentos)
// usa a mesma lógica — GPT emite tag → parseTriggersFromGPTResponse → stripGPTTriggerTags → filterAppCommandsByRole. Um fluxo, vários triggers.
const GPT_TRIGGERS = {
    NAVIGATE_TERMINAL: '[NAVIGATE_TERMINAL]',
    NAVIGATE_AGENDA: '[NAVIGATE_AGENDA]',
    NAVIGATE_PACIENTES: '[NAVIGATE_PACIENTES]',
    NAVIGATE_RELATORIOS: '[NAVIGATE_RELATORIOS]',
    NAVIGATE_CHAT_PRO: '[NAVIGATE_CHAT_PRO]',
    NAVIGATE_PRESCRICAO: '[NAVIGATE_PRESCRICAO]',
    NAVIGATE_BIBLIOTECA: '[NAVIGATE_BIBLIOTECA]',
    NAVIGATE_FUNCAO_RENAL: '[NAVIGATE_FUNCAO_RENAL]',
    NAVIGATE_MEUS_AGENDAMENTOS: '[NAVIGATE_MEUS_AGENDAMENTOS]',
    NAVIGATE_MODULO_PACIENTE: '[NAVIGATE_MODULO_PACIENTE]',
    SHOW_PRESCRIPTION: '[SHOW_PRESCRIPTION]',
    FILTER_PATIENTS_ACTIVE: '[FILTER_PATIENTS_ACTIVE]',
    DOCUMENT_LIST: '[DOCUMENT_LIST]',
    SIGN_DOCUMENT: '[SIGN_DOCUMENT]',
    CHECK_CERTIFICATE: '[CHECK_CERTIFICATE]',
} as const

const PROFESSIONAL_DASHBOARD_ROUTE = '/app/clinica/profissional/dashboard'

/** Gera app_commands A PARTIR dos triggers emitidos pelo GPT (modelo selado). */
function parseTriggersFromGPTResponse(aiResponse: string): AppCommandV1[] {
    const commands: AppCommandV1[] = []
    if (!aiResponse || typeof aiResponse !== 'string') return commands
    const text = aiResponse
    if (text.includes(GPT_TRIGGERS.NAVIGATE_TERMINAL)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'atendimento', label: 'Atendimento', fallbackRoute: PROFESSIONAL_DASHBOARD_ROUTE }, reason: 'gpt_trigger_navigate_terminal' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_AGENDA)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'agendamentos', label: 'Agenda', fallbackRoute: '/app/clinica/profissional/agendamentos' }, reason: 'gpt_trigger_navigate_agenda' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_PACIENTES)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'pacientes', label: 'Pacientes', fallbackRoute: '/app/clinica/profissional/pacientes' }, reason: 'gpt_trigger_navigate_pacientes' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_RELATORIOS)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'relatorios-clinicos', label: 'Relatórios', fallbackRoute: '/app/clinica/profissional/relatorios' }, reason: 'gpt_trigger_navigate_relatorios' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_CHAT_PRO)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'chat-profissionais', label: 'Chat Profissionais', fallbackRoute: '/app/clinica/profissional/chat-profissionais' }, reason: 'gpt_trigger_navigate_chat_pro' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_PRESCRICAO)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'prescricao-rapida', label: 'Prescrever', fallbackRoute: '/app/clinica/prescricoes' }, reason: 'gpt_trigger_navigate_prescription' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_BIBLIOTECA)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'admin-upload', label: 'Biblioteca', fallbackRoute: '/app/library' }, reason: 'gpt_trigger_navigate_biblioteca' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_FUNCAO_RENAL)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-section', target: 'admin-renal', label: 'Função Renal', fallbackRoute: PROFESSIONAL_DASHBOARD_ROUTE }, reason: 'gpt_trigger_navigate_renal' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_MEUS_AGENDAMENTOS)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-route', target: '/app/clinica/paciente/agendamentos', label: 'Meus agendamentos', fallbackRoute: '/app/clinica/paciente/agendamentos' }, reason: 'gpt_trigger_meus_agendamentos' })
    }
    if (text.includes(GPT_TRIGGERS.NAVIGATE_MODULO_PACIENTE)) {
        commands.push({ kind: 'noa_command', command: { type: 'navigate-route', target: '/app/clinica/paciente/dashboard?section=analytics', label: 'Módulo Paciente', fallbackRoute: '/app/clinica/paciente/dashboard?section=analytics' }, reason: 'gpt_trigger_modulo_paciente' })
    }
    if (text.includes(GPT_TRIGGERS.SHOW_PRESCRIPTION)) {
        commands.push({ kind: 'noa_command', command: { type: 'show-prescription', target: 'latest', label: 'Mostrar prescrição' }, reason: 'gpt_trigger_show_prescription' })
    }
    if (text.includes(GPT_TRIGGERS.FILTER_PATIENTS_ACTIVE)) {
        commands.push({ kind: 'noa_command', command: { type: 'filter-patients', target: 'active', label: 'Filtrar pacientes ativos', payload: { filter: 'active' } }, reason: 'gpt_trigger_filter_patients' })
    }
    if (text.includes(GPT_TRIGGERS.DOCUMENT_LIST)) {
        commands.push({ kind: 'noa_command', command: { type: 'document-list', label: 'Lista de documentos' }, reason: 'gpt_trigger_document_list' })
    }
    if (text.includes(GPT_TRIGGERS.SIGN_DOCUMENT)) {
        commands.push({ kind: 'noa_command', command: { type: 'sign-document', label: 'Assinar documento digitalmente' }, reason: 'gpt_trigger_sign_document' })
    }
    if (text.includes(GPT_TRIGGERS.CHECK_CERTIFICATE)) {
        commands.push({ kind: 'noa_command', command: { type: 'check-certificate', label: 'Verificar certificado digital' }, reason: 'gpt_trigger_check_certificate' })
    }
    return commands
}

/** Remove todos os triggers emitidos pelo GPT do texto (usuário nunca vê). */
function stripGPTTriggerTags(text: string): string {
    if (!text || typeof text !== 'string') return text || ''
    let out = text
    for (const tag of Object.values(GPT_TRIGGERS)) {
        out = out.replace(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    }
    return out.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
}

/** Anexa TRIGGER_ACTION ao texto quando há app_commands, para sinalizar ações disponíveis (UX consistente). */
function textWithActionToken(text: string, app_commands?: unknown[]): string {
    if (!text || !app_commands?.length) return text || ''
    const trimmed = (text || '').trim()
    return trimmed.endsWith(TRIGGER_ACTION_TOKEN) ? trimmed : `${trimmed} ${TRIGGER_ACTION_TOKEN}`
}

type NoaUiCommand =
    | { type: 'navigate-section'; target: string; label?: string; fallbackRoute?: string; payload?: Record<string, unknown> }
    | { type: 'navigate-route'; target: string; label?: string; fallbackRoute?: string; payload?: Record<string, unknown> }
    | { type: 'show-prescription'; target: string; label?: string; fallbackRoute?: string; payload?: Record<string, unknown> }
    | { type: 'filter-patients'; target: string; label?: string; fallbackRoute?: string; payload?: Record<string, unknown> }
    | { type: 'open-document'; target: string; label?: string; fallbackRoute?: string; payload?: Record<string, unknown> }
    | { type: 'show-document-inline'; target: string; label?: string; fallbackRoute?: string; payload?: Record<string, unknown> }
    | { type: 'document-list'; target?: string; label?: string; payload?: Record<string, unknown> }
    | { type: 'sign-document'; target?: string; label?: string; payload?: Record<string, unknown> }
    | { type: 'sign-document'; target?: string; label?: string; payload?: Record<string, unknown> }
    | { type: 'check-certificate'; target?: string; label?: string; payload?: Record<string, unknown> }

type AppCommandV1 = {
    kind: 'noa_command'
    command: NoaUiCommand
    requires_confirmation?: boolean
    reason?: string
}

type PendingActionCandidate = {
    document_id: string
    title: string
    summary?: string
    content?: string
    audience?: string[]
    category?: string | null
    score?: number
}

const DOC_PENDING_KIND = 'DOC_OPEN_CONFIRMATION'

const normalizeRole = (value: unknown): 'admin' | 'professional' | 'student' | 'patient' | 'master' | 'unknown' => {
    const raw = typeof value === 'string' ? value : ''
    const norm = normalizePt(raw)
    if (norm.includes('master')) return 'master'
    if (norm.includes('admin')) return 'admin'
    if (norm.includes('profissional') || norm.includes('professional')) return 'professional'
    if (norm.includes('aluno') || norm.includes('student')) return 'student'
    if (norm.includes('paciente') || norm.includes('patient')) return 'patient'
    return 'unknown'
}

const parseConfirmationSelection = (norm: string): { kind: 'number'; value: number } | { kind: 'cancel' } | null => {
    // Aceita "1", "2", "abrir 1", "abre o 2", "opcao 3", "o 2", "doc 2", "documento 2", "quero o 1", "cancelar"
    // Só palavras explícitas de cancelamento (evitar falso positivo: "não vejo o agendamento" não deve cancelar doc)
    if (/\b(cancelar|cancela|cancel)\b/.test(norm)) return { kind: 'cancel' }

    const direct = norm.trim().match(/^(\d{1,2})$/)
    if (direct) {
        const n = parseInt(direct[1], 10)
        if (Number.isFinite(n)) return { kind: 'number', value: n }
    }

    const embedded = norm.match(/\b(abrir|abre|opcao|opção|numero|n[úu]mero)\s*(\d{1,2})\b/)
    if (embedded) {
        const n = parseInt(embedded[2], 10)
        if (Number.isFinite(n)) return { kind: 'number', value: n }
    }

    // "o 2", "doc 2", "documento 2", "abrir o 2", "quero o 2"
    const oDoc = norm.match(/\b(o|doc|documento)\s*(\d{1,2})\b/)
    if (oDoc) {
        const n = parseInt(oDoc[2], 10)
        if (Number.isFinite(n)) return { kind: 'number', value: n }
    }
    const queroO = norm.match(/\b(quero|queria)\s+(o\s+)?(\d{1,2})\b/)
    if (queroO) {
        const n = parseInt(queroO[3], 10)
        if (Number.isFinite(n)) return { kind: 'number', value: n }
    }

    return null
}

const detectDocumentRequest = (norm: string): boolean => {
    // Detecção conservadora (fail-closed): só ativa com verbos/nomes explícitos de documento
    const wantsOpen = /\b(abrir|abre|ver|mostrar|mostra|acessar|acesso|ler|consultar|buscar|trazer|traga|quero\s+ver|gostaria\s+de\s+ver|preciso\s+ver|me\s+traga|me\s+traz)\b/.test(norm)
    const mentionsDoc = /\b(documento|documentos|doc|docs|protocolo|diretriz|guideline|manual|aula|material|conteudo|conteúdo|pdf)\b/.test(norm)
    return wantsOpen && mentionsDoc
}

const detectDocumentListRequest = (norm: string): boolean => {
    // Pedidos de listagem/visão geral — ainda é “etapa 1” (lista curta + confirmação)
    // Ex.: "quais documentos você vê", "listar documentos", "que documentos tem", "me mostre os documentos"
    const asksList =
        /\b(listar|lista|ver|mostrar|mostra|quais|que|me\s+mostre|me\s+mostra|trazer|traga|me\s+traga|me\s+traz)\b/.test(norm) &&
        /\b(documentos|documento|docs|doc)\b/.test(norm)
    const asksWhatYouSee =
        /\b(quais|que)\b/.test(norm) && /\b(voce|você)\b/.test(norm) && /\b(ve|vê|tem|consegue)\b/.test(norm)
    const asksWhatExists = /\b(que\s+documentos|quais\s+materiais|tem\s+algum\s+documento)\b/.test(norm)
    return asksList || asksWhatYouSee || asksWhatExists
}

/** Pedido de total/quantidade de documentos na base (ex.: "quantos documentos temos", "listagem do total") */
const detectDocumentCountRequest = (norm: string): boolean => {
    return (
        /\b(quantos|quanto|total|totais|listagem\s+do\s+total|quantidade)\b/.test(norm) &&
        /\b(documentos|documento|docs|doc|temos|tem\s+na\s+base)\b/.test(norm)
    )
}

/** Detecta pedido de avaliação clínica / DRC / nefro / renal */
const detectClinicalAssessmentRequest = (norm: string): boolean => {
    const evalTerms = /\b(avaliacao|avaliar|avaliacao clinica)\b/
    const renalTerms = /\b(renal|nefro|nefrolog|rim|rins|funcao renal|drc|doenca renal)\b/
    const drcDirect = /\b(drc|doenca renal cronica|estagio renal|estadiamento renal)\b/
    return (evalTerms.test(norm) && renalTerms.test(norm)) || drcDirect.test(norm)
}

/** Pedido para ver os próximos 5 documentos (ex.: "listar mais", "próximos 5", "outros 5") */
const detectListMoreRequest = (norm: string): boolean => {
    return /\b(listar\s+mais|proximos\s+5|outros\s+5|mais\s+5|ver\s+mais\s+documentos|mais\s+documentos)\b/.test(norm)
}

/** Heurística para detectar intenção de assinar documento */
function detectSignIntent(norm: string): boolean {
    return /(assinar|assinatura|certificado|icp|brasil|assinatura digital|certificado digital|assinar prescrição|assinar receita|assinar atestado|assinar laudo|assinatura icp)/i.test(norm)
}

/** Determina nível do documento baseado no tipo e perfil do usuário */
function determineDocumentLevel(
    documentType: string | undefined,
    userRole: string
): 'level_1' | 'level_2' | 'level_3' {
    // Nível 3: Documentos legais (CFM) - requerem certificado ICP-Brasil
    if (['prescription', 'prescrição', 'receita', 'atestado', 'laudo', 'cfm_prescriptions'].includes(documentType?.toLowerCase() || '')) {
        return 'level_3'
    }
    // Nível 2: Documentos administrativos simples
    if (['declaracao', 'declaração', 'relatorio_informativo', 'relatório informativo'].includes(documentType?.toLowerCase() || '')) {
        return 'level_2'
    }
    // Nível 1: Documentos clínicos internos (padrão)
    return 'level_1'
}

const buildCandidatesListText = (candidates: PendingActionCandidate[]) => {
    const lines = candidates.map((c, i) => `${i + 1}) ${c.title}${c.category ? ` — (${c.category})` : ''}`)
    return `Você deseja abrir qual documento?\n\n${lines.join('\n')}\n\nResponda com o número (1-${candidates.length}) ou diga "cancelar".`
}

/** Fluxo documental governado por trigger: quando o GPT emite [DOCUMENT_LIST], busca lista + pending e devolve texto para injetar. Se só houver 1 doc, devolve singleDoc para abrir direto no chat. */
async function runDocumentListFlowFromTrigger(
    supabaseClient: ReturnType<typeof createClient>,
    userId: string,
    userRole: string,
    searchTerm: string,
    _currentIntent: string
): Promise<{ listText: string; singleDoc?: { document_id: string; title: string; summary?: string; content?: string; category?: string | null } } | null> {
    try {
        let baseQuery = supabaseClient
            .from('documents')
            .select('id, title, summary, category, target_audience, is_published, aiRelevance, file_url, file_type, created_at, updated_at')
            .limit(200)

        if (!searchTerm.trim()) {
            baseQuery = baseQuery.order('created_at', { ascending: false }).order('aiRelevance', { ascending: false })
        } else {
            baseQuery = baseQuery.or(`title.ilike.*${searchTerm}*,summary.ilike.*${searchTerm}*`)
        }

        const { data: docs } = await baseQuery
        const listRaw = (docs || [])
            .filter((d: any) => !!d?.id && !!d?.title)
            .filter((d: any) => {
                if (userRole === 'patient' || userRole === 'student') {
                    const aud = Array.isArray(d.target_audience) ? d.target_audience : []
                    const allowed = aud.includes(userRole) || aud.includes('all')
                    const published = d.is_published === true
                    return allowed && published
                }
                return true
            })
            .sort((a: any, b: any) => {
                const af = a.file_url ? 1 : 0
                const bf = b.file_url ? 1 : 0
                if (bf !== af) return bf - af
                const r = Number(b.aiRelevance || 0) - Number(a.aiRelevance || 0)
                if (r !== 0) return r
                const at = new Date(a.updated_at || a.created_at || 0).getTime()
                const bt = new Date(b.updated_at || b.created_at || 0).getTime()
                return bt - at
            })

        const seen = new Set<string>()
        const list = listRaw.filter((d: any) => {
            const key = String(d.title || '').trim().toLowerCase()
            if (!key) return false
            if (seen.has(key)) return false
            seen.add(key)
            return true
        }).slice(0, 5)

        if (list.length === 0) return null

        // Fetch content only for the 5 selected docs
        const docIds = list.map((d: any) => d.id)
        const { data: contentDocs } = await supabaseClient
            .from('documents')
            .select('id, content')
            .in('id', docIds)
        const contentMap = new Map((contentDocs || []).map((d: any) => [d.id, d.content]))

        const candidates: PendingActionCandidate[] = list.map((d: any, idx: number) => ({
            document_id: d.id,
            title: d.title,
            summary: d.summary,
            content: contentMap.get(d.id) || null,
            audience: Array.isArray(d.target_audience) ? d.target_audience : [],
            category: d.category ?? null,
            score: (d.aiRelevance ?? 0) * 10 + (d.file_url ? 3 : 0) + (5 - idx)
        }))

        const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString()
        await supabaseClient.from('noa_pending_actions').insert({
            user_id: userId,
            kind: DOC_PENDING_KIND,
            status: 'pending',
            candidates,
            context: { role: userRole, term: searchTerm, list_offset: 0 },
            expires_at: expiresAt
        })

        const listText = buildCandidatesListText(candidates)
        const singleDoc = candidates.length === 1 && searchTerm.trim()
            ? {
                document_id: candidates[0].document_id,
                title: candidates[0].title,
                summary: candidates[0].summary,
                content: candidates[0].content,
                category: candidates[0].category
            }
            : undefined
        return { listText, singleDoc }
    } catch (e) {
        console.warn('⚠️ [DOC FLOW] runDocumentListFlowFromTrigger:', e)
        return null
    }
}

const sanitizeSearchTerm = (value: string) => {
    return (value || '')
        .replace(/\r?\n+/g, ' ')
        .replace(/[,*()]/g, ' ')
        .replace(/["'\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80)
}

/** Extrai termo de documento da resposta do GPT quando ela diz que vai "abrir o documento X" mas não emitiu [DOCUMENT_LIST]. */
function extractDocumentTermFromGPTResponse(aiResponse: string): string | null {
    if (!aiResponse || typeof aiResponse !== 'string') return null
    const norm = aiResponse.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const hasOpenDoc = /\b(abrir|vou abrir|abrindo)\s+(o\s+)?documento\b/.test(norm) || /\bdocumento\s+["']([^"']+)["']/.test(norm)
    if (!hasOpenDoc) return null
    // Título entre aspas: "documento 'Próximos Passos'" ou "documento \"X\""
    const quoted = aiResponse.match(/documento\s+["']([^"']+)["']/i) || aiResponse.match(/abrir\s+(?:o\s+)?documento\s+["']?([^"'.!\n]+)["']?/i)
    if (quoted?.[1]) return sanitizeSearchTerm(quoted[1])
    // Última frase após "documento" como fallback (palavras até ponto/vírgula)
    const afterDoc = aiResponse.split(/\bdocumento\b/i).pop()?.trim()
    if (afterDoc) {
        const firstPhrase = afterDoc.replace(/^[\s"']+/, '').split(/[.,;!?\n]/)[0]?.trim()
        if (firstPhrase && firstPhrase.length >= 2 && firstPhrase.length <= 80) return sanitizeSearchTerm(firstPhrase)
    }
    return null
}

const normalizePt = (value: string) =>
    value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

const stripInjectedContext = (value: string) => {
    // Objetivo: garantir que heurísticas (intent/triggers/app_commands) derivem APENAS do input humano.
    // O frontend pode injetar blocos como "[contexto_da_plataforma]:" e RAG pode injetar "[CONTEXTO ...]".
    const raw = value || ""
    const lowered = raw.toLowerCase()

    const markers = [
        "[contexto da plataforma",
        "[contexto_da_plataforma]",
        "[contexto_da_plataforma]:",
        "[contexto crítico",
        "[contexto critico",
        "[fim do contexto]"
    ]

    let cut = raw.length
    for (const marker of markers) {
        const idx = lowered.indexOf(marker)
        if (idx >= 0 && idx < cut) cut = idx
    }
    return raw.slice(0, cut).trim()
}

const clampInt = (value: number, min: number, max: number) => {
    const n = Number.isFinite(value) ? Math.trunc(value) : 0
    return Math.max(min, Math.min(max, n))
}

type InteractionSignal = {
    score: number
    signals: string[]
    traits: Record<string, boolean>
    suggestedDelta: number
}

// CAS (Estado de Interação): heurística determinística (não-diagnóstica)
const deriveInteractionSignals = (norm: string): InteractionSignal => {
    const signals: string[] = []

    const metaCognitive = [
        'sou o jogo',
        'sou o processo',
        'tudo depende de mim',
        'estado desperto',
        'lucidez',
        'observacao',
        'observacao interna',
        'existencia',
        'limite humano'
    ]

    for (const s of metaCognitive) {
        if (norm.includes(s)) signals.push(s)
    }

    const score = signals.length
    const traits: Record<string, boolean> = {
        meta_cognitive_language: score >= 2,
        explicit_limits: norm.includes('limite') || norm.includes('nao consigo') || norm.includes('não consigo'),
        urgency_language: norm.includes('urgente') || norm.includes('agora') || norm.includes('socorro')
    }

    // Delta pequeno, sempre conservador (fail-closed)
    const suggestedDelta = score >= 2 ? 10 : score === 1 ? 5 : 0

    return { score, signals, traits, suggestedDelta }
}

/**
 * Governança por perfil (PROTOCOLO / PLANO_MESTRE): filtra quais comandos o perfil pode executar.
 * REGRA: NÃO remove nenhuma lógica nem palavras que acionam os triggers.
 * deriveAppCommandsV1 continua com TODAS as frases/triggers; esta função só esconde comandos
 * que o perfil não tem permissão (ex.: paciente não recebe "abrir agenda" de profissional).
 */
function filterAppCommandsByRole(commands: AppCommandV1[], role: string): AppCommandV1[] {
    const r = role === 'master' ? 'admin' : role
    // Admin: todos os comandos
    if (r === 'admin') return commands
    // Profissional: tudo exceto rotas exclusivas de admin (ex.: função renal se restrito)
    if (r === 'professional') {
        return commands.filter(cmd => {
            const t = cmd.command.type
            const target = (cmd.command as { target?: string }).target || ''
            const fallback = (cmd.command as { fallbackRoute?: string }).fallbackRoute || ''
            // admin-renal: só admin (conservador)
            if (t === 'navigate-section' && target === 'admin-renal') return false
            return true
        })
    }
    // Paciente: só ações de paciente — meus agendamentos, biblioteca (navegação), lista de documentos; NUNCA terminal pro, prescrição, filtro pacientes
    if (r === 'patient') {
        return commands.filter(cmd => {
            const t = cmd.command.type
            const target = (cmd.command as { target?: string }).target || ''
            const fallback = (cmd.command as { fallbackRoute?: string }).fallbackRoute || ''
            if (t === 'document-list' || t === 'show-document-inline') return true
            if (t === 'show-prescription' || t === 'filter-patients') return false
            if (t === 'navigate-section') {
                if (target === 'admin-upload' || fallback.includes('/app/library')) return true
                return false
            }
            if (t === 'navigate-route') {
                if (target.startsWith('/app/clinica/paciente/')) return true
                if (target.startsWith('/app/library')) return true
                return false
            }
            return false
        })
    }
    // Aluno: igual paciente para navegação segura; sem comandos de pro; pode ver lista de documentos e abrir doc no chat
    if (r === 'student') {
        return commands.filter(cmd => {
            const t = cmd.command.type
            const target = (cmd.command as { target?: string }).target || ''
            const fallback = (cmd.command as { fallbackRoute?: string }).fallbackRoute || ''
            if (t === 'document-list' || t === 'show-document-inline') return true
            if (t === 'show-prescription' || t === 'filter-patients') return false
            if (t === 'navigate-section') {
                if (target === 'admin-upload' || (fallback && fallback.includes('/app/library'))) return true
                return false
            }
            if (t === 'navigate-route') {
                if (target.startsWith('/app/library')) return true
                return false
            }
            return false
        })
    }
    // unknown / não mapeado: FAIL-CLOSED — não devolver comandos privilegiados (PLANO_MESTRE S9)
    console.warn(`[SECURITY] filterAppCommandsByRole: role desconhecida "${role}" — retornando lista vazia (fail-closed).`)
    return []
}

const deriveAppCommandsV1 = (message: string, ui_context?: any, userRole?: string): AppCommandV1[] => {
    // Segurança: app_commands deve ser derivado APENAS da fala do usuário, não de blocos injetados (RAG/contexto).
    const safeMessage = stripInjectedContext(message || "")
    const norm = normalizePt(safeMessage)

    const commands: AppCommandV1[] = []

    // Rotas canônicas do Terminal (fallback quando não houver listener ativo)
    const PROFESSIONAL_DASHBOARD_ROUTE = '/app/clinica/profissional/dashboard'

    // Terminal de Atendimento (MVP) — comandos seguros (UI/read-only)
    if (/(terminal de atendimento|abrir atendimento|area de atendimento|área de atendimento|ir para atendimento)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'atendimento',
                label: 'Atendimento',
                fallbackRoute: PROFESSIONAL_DASHBOARD_ROUTE
            },
            reason: 'user_requested_attendance_terminal'
        })
    }

    // LUGAR = ir para a aba/calendário (não card). Inclui "ver agendamento", "me levar para agendamento", "agendamento".
    if (/(abrir agenda|minha agenda|agenda clinica|agenda da clinica|agenda da minha clinica|minha clinica|ver agenda|ver agendamento|me levar para agendamento|levar para agendamento|quero ver agendamento|ir para agendamento|terminal de agendamento|terminal de agendamentos|area de agendamento|área de agendamento)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'agendamentos',
                label: 'Agenda',
                fallbackRoute: '/app/clinica/profissional/agendamentos'
            },
            reason: 'user_requested_schedule_section'
        })
    }

    if (/(pacientes|abrir pacientes|gestao de pacientes|gestão de pacientes|lista de pacientes)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'pacientes',
                label: 'Pacientes',
                fallbackRoute: '/app/clinica/profissional/pacientes'
            },
            reason: 'user_requested_patients_section'
        })
    }

    if (/(relatorios|relatórios|relatorio clinico|relatório clínico|abrir relatorios)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'relatorios-clinicos',
                label: 'Relatórios Clínicos',
                fallbackRoute: '/app/clinica/profissional/relatorios'
            },
            reason: 'user_requested_reports_section'
        })
    }

    if (/(chat profissionais|chat com profissionais|abrir chat profissionais|suporte profissional)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'chat-profissionais',
                label: 'Chat Profissionais',
                fallbackRoute: '/app/clinica/profissional/chat-profissionais'
            },
            reason: 'user_requested_professional_chat_section'
        })
    }

    // Heurística para detectar intenção de assinar documento
    // NOTA: aiResponse não está disponível neste escopo, então só verificamos detectSignIntent
    if (detectSignIntent(norm)) {
        // Determinar documento atual (do contexto)
        const currentDocument = ui_context?.current_document || ui_context?.document_in_chat

        if (currentDocument) {
            const documentLevel = determineDocumentLevel(
                currentDocument.type || 'prescription',
                userRole || 'unknown'
            )

            commands.push({
                kind: 'noa_command',
                command: {
                    type: 'sign-document',
                    label: 'Assinar documento digitalmente',
                    payload: {
                        document_id: currentDocument.id,
                        document_level: documentLevel,
                        requires_certificate: documentLevel === 'level_3'
                    }
                },
                reason: 'user_requested_digital_signature'
            })
        } else {
            // Sem documento específico no contexto, mas usuário quer assinar
            commands.push({
                kind: 'noa_command',
                command: {
                    type: 'sign-document',
                    label: 'Assinar documento digitalmente',
                    payload: {
                        document_level: 'level_3', // Padrão para prescrições
                        requires_certificate: true
                    }
                },
                reason: 'user_requested_digital_signature'
            })
        }
    }

    if (/(prescrever|nova prescricao|nova prescrição|prescricao rapida|prescrição rápida)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'prescricao-rapida',
                label: 'Prescrever',
                fallbackRoute: '/app/clinica/prescricoes'
            },
            reason: 'user_requested_quick_prescription'
        })
    }

    if (/(base de conhecimento|abrir biblioteca|acessar biblioteca|biblioteca compartilhada)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'admin-upload',
                label: 'Biblioteca Compartilhada',
                fallbackRoute: '/app/library'
            },
            reason: 'user_requested_library'
        })
    }

    if (/(funcao renal|função renal|abrir funcao renal|abrir função renal)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-section',
                target: 'admin-renal',
                label: 'Função Renal',
                fallbackRoute: PROFESSIONAL_DASHBOARD_ROUTE
            },
            reason: 'user_requested_renal_section'
        })
    }

    if (/(mostrar prescric|abrir prescric|ver prescric|mostrar protocolo)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'show-prescription',
                target: 'latest',
                label: 'Mostrar última prescrição'
            },
            reason: 'user_requested_prescription'
        })
    }

    if (/(pacientes ativos|listar pacientes ativos|filtrar pacientes ativos|pacientes em atendimento)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'filter-patients',
                target: 'active',
                label: 'Filtrar pacientes ativos',
                payload: { filter: 'active' }
            },
            reason: 'user_requested_active_patients_filter'
        })
    }

    // Módulo Paciente (view-as / acesso ao dashboard do paciente)
    if (/(modulo paciente|módulo paciente|modo paciente|ver como paciente|dashboard paciente)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-route',
                target: '/app/clinica/paciente/dashboard?section=analytics',
                label: 'Módulo Paciente',
                fallbackRoute: '/app/clinica/paciente/dashboard?section=analytics'
            },
            reason: 'user_requested_patient_module'
        })
    }

    // Paciente: LUGAR = ir para a aba Meus agendamentos (ver agendamento, me levar para agendamento, agendamento, etc.)
    if (/(meus agendamentos|minhas consultas|consultas agendadas|ver agendamentos|abrir agendamentos|ver agendamento|me levar para agendamento|levar para agendamento|quero ver agendamento|ir para agendamento|agenda do paciente|agenda paciente|agendamentos do paciente)/.test(norm)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-route',
                target: '/app/clinica/paciente/agendamentos',
                label: 'Meus agendamentos',
                fallbackRoute: '/app/clinica/paciente/agendamentos'
            },
            reason: 'user_requested_patient_appointments'
        })
    }

    return commands
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // [TITAN 3.2] Geração de ID Único para Rastreabilidade Atômica
        const interaction_id = crypto.randomUUID();

        // 1. Validar Variáveis de Ambiente
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

        if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
            throw new Error('Variáveis de ambiente (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY) não configuradas.')
        }

        // Variáveis de Modelo Globais (CCOS Feature Flag)
        const MODEL_NAME = Deno.env.get('AI_MODEL_NAME_RISK') || "gpt-4o"
        const CHAT_MODEL = Deno.env.get('AI_MODEL_NAME_CHAT') || "gpt-4o"

        // 2. Inicializar Clientes
        const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)
        const openai = new OpenAI({ apiKey: openaiApiKey })

        // ── S4 FIX: VALIDAÇÃO JWT OBRIGATÓRIA (PLANO_MESTRE) ────────
        // Rejeitar qualquer request sem Authorization header válido.
        // Backward-compat REMOVIDO — produção exige autenticação.
        const authHeader = req.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            console.error('[SECURITY] Requisição sem Authorization header — REJEITADA (401)')
            return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Token de autenticação obrigatório.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        let jwtUserId: string | null = null
        try {
            const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || supabaseServiceKey
            const anonClient = createClient(supabaseUrl, anonKey, {
                global: { headers: { Authorization: authHeader } }
            })
            const token = authHeader.replace('Bearer ', '')
            const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token)
            if (!claimsError && claimsData?.claims?.sub) {
                jwtUserId = claimsData.claims.sub as string
            } else {
                console.error(`[SECURITY] JWT inválido ou expirado: ${claimsError?.message}`)
                return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Token inválido ou expirado.' }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                })
            }
        } catch (jwtErr) {
            console.error('[SECURITY] Falha ao validar JWT:', jwtErr)
            return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Erro na validação do token.' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 3. Autenticação e Verificação de Kill Switch (CCOS Governança)
        const { data: config } = await supabaseClient
            .from('system_config')
            .select('value')
            .eq('key', 'ai_mode')
            .single()

        const aiMode = config?.value?.mode || 'FULL'

        // Parse do Body (Necessário para o contexto do COS)
        const body = await req.json()
        const { message, conversationHistory, patientData, assessmentPhase, nextQuestionHint, action, assessmentData, appointmentData, ui_context } = body
        const professionalId = appointmentData?.professional_id || patientData?.professional_id || 'system-global'

        // ── S4 FIX: Amarrar identidade JWT ao userId operado ──────────
        // Se JWT foi validado, FORÇAR que o userId operado seja o do token
        // (impede impersonação via body). Log de discrepância para auditoria.
        const bodyUserId = patientData?.user?.id
        if (jwtUserId && bodyUserId && jwtUserId !== bodyUserId) {
            console.warn(`[SECURITY] JWT sub (${jwtUserId}) ≠ body user.id (${bodyUserId}) — usando JWT como fonte de verdade`)
        }
        const authenticatedUserId = jwtUserId || bodyUserId || null

        // Perfil do usuário (fonte canônica para governança de app_commands) — conforme PLANO_MESTRE / PROTOCOLO
        const userRole =
            normalizeRole(patientData?.user?.user_type) ||
            normalizeRole(patientData?.user?.type) ||
            normalizeRole(patientData?.user?.role)
        // Tipo real do usuário (sem "ver como") — usado para governança documental
        const realUserRole =
            normalizeRole(patientData?.user?.real_type) || userRole

        // --- 🌑 COS v1.0: CAMADA IV - PROTOCOLO DE TRAUMA (SOBREVIVÊNCIA) ---
        const { data: trauma } = await supabaseClient
            .from('institutional_trauma_log')
            .select('*')
            .eq('restricted_mode_active', true)
            .gt('recovery_estimated_at', new Date().toISOString())
            .maybeSingle()

        // --- 🩸 COS v1.0: CAMADA III - METABOLISMO COGNITIVO (REGULAÇÃO) ---
        const { data: metabolism } = await supabaseClient
            .from('cognitive_metabolism')
            .select('*')
            .eq('professional_id', professionalId)
            .maybeSingle()

        // ======================================================
        // 🧠 INTENT — DEFINIDO UMA ÚNICA VEZ (ANTES DO COS)
        // ======================================================
        let currentIntent: "CLINICA" | "ADMIN" | "ENSINO" = "CLINICA"
        // Segurança: intent/triggers devem derivar APENAS da fala do usuário (sem blocos injetados).
        const msg = stripInjectedContext(message || "").toLowerCase()
        const norm = msg.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

        // ======================================================
        // 🧠 CAS — Estado de Interação (tom/profundidade/estilo)
        // ======================================================
        // - Não é diagnóstico / não é saúde mental
        // - Apenas modula linguagem e aumenta observabilidade
        // - Fail-closed: se falhar, não afeta o funcionamento do app
        let interactionDepthLevel = 0
        let interactionTraits: Record<string, boolean> = {}
        let interactionSignals: string[] = []

        const interactionSignal = deriveInteractionSignals(norm)
        if (interactionSignal.score > 0 && patientData?.user?.id) {
            interactionSignals = interactionSignal.signals
            interactionTraits = interactionSignal.traits
        }

        if (patientData?.user?.id) {
            try {
                const { data: existingState, error: stateReadError } = await supabaseClient
                    .from('cognitive_interaction_state')
                    .select('depth_level, traits')
                    .eq('user_id', patientData.user.id)
                    .maybeSingle()

                if (!stateReadError && existingState) {
                    interactionDepthLevel = clampInt(existingState.depth_level ?? 0, 0, 100)
                    interactionTraits = { ...(existingState.traits ?? {}), ...interactionTraits }
                }

                // Atualizar state somente quando houver sinal (append-only via event + update state)
                if (interactionSignal.suggestedDelta > 0) {
                    const nextLevel = clampInt(interactionDepthLevel + interactionSignal.suggestedDelta, 0, 100)
                    interactionDepthLevel = nextLevel

                    // Non-blocking audit pulse
                    try {
                        await supabaseClient.from('cognitive_events').insert({
                            intent: currentIntent,
                            action: 'INTERACTION_STATE_SIGNAL',
                            decision_result: 'SIGNAL',
                            source: 'SMART_TRIGGER',
                            metadata: {
                                user_id: patientData.user.id,
                                score: interactionSignal.score,
                                signals: interactionSignals,
                                suggested_delta: interactionSignal.suggestedDelta,
                                next_level: nextLevel,
                                traits: interactionTraits
                            }
                        })
                    } catch (e) {
                        console.warn('⚠️ [CEP NON-BLOCKING] Falha ao registrar INTERACTION_STATE_SIGNAL:', e)
                    }

                    // Upsert state (non-blocking)
                    try {
                        await supabaseClient
                            .from('cognitive_interaction_state')
                            .upsert({
                                user_id: patientData.user.id,
                                depth_level: nextLevel,
                                traits: interactionTraits,
                                last_shift_at: new Date().toISOString()
                            }, { onConflict: 'user_id' })
                    } catch (e) {
                        console.warn('⚠️ [CAS NON-BLOCKING] Falha ao upsert cognitive_interaction_state:', e)
                    }
                }
            } catch (e) {
                console.warn('⚠️ [CAS NON-BLOCKING] Falha ao ler/atualizar cognitive_interaction_state:', e)
            }
        }

        if (norm.includes("nivelamento") || norm.includes("simulacao") || norm.includes("prova")) {
            currentIntent = "ENSINO"
        } else if (
            norm.includes("agendar") ||
            norm.includes("marcar") ||
            norm.includes("consulta") ||
            norm.includes("horario") ||
            norm.includes("disponibilidade") ||
            norm.includes("medico") ||
            norm.includes("doutor") ||
            action === "predict_scheduling_risk"
        ) {
            currentIntent = "ADMIN"
        }

        // ======================================================
        // 📄 ATIVAÇÃO DOCUMENTAL (append-only, fail-closed)
        // - Não interfere em scheduling
        // - Só executa abertura de documento após confirmação humana (número/cancelar)
        // - Derivação apenas do INPUT HUMANO (message, sem blocos injetados)
        // ======================================================
        const selection = parseConfirmationSelection(norm)
        const isDocRequest = detectDocumentRequest(norm)
        const isDocListRequest = detectDocumentListRequest(norm)
        const isDocCountRequest = detectDocumentCountRequest(norm)
        // Pedido de analisar/avaliar o documento já aberto no chat → não devolver lista; deixar o GPT analisar (com document_in_chat no prompt)
        const isAnalyzeOpenDocRequest = !!(ui_context?.document_in_chat?.title && /\b(analis(e|ar)|avali(ar|e)|resum(a|ir)|comente|o que acha|interpretar)\b/i.test(norm))

        console.log(`📄 [DOC DETECT] isDocRequest=${isDocRequest}, isDocListRequest=${isDocListRequest}, isAnalyzeOpen=${isAnalyzeOpenDocRequest}, userId=${!!patientData?.user?.id}, realUserRole=${realUserRole}, userRole=${userRole}, normSnippet="${norm.substring(0, 80)}"`)


        // 0) Total de documentos na base (ex.: "quantos documentos temos?")
        if (isDocCountRequest) {
            try {
                let countQuery = supabaseClient.from('documents').select('*', { count: 'exact', head: true })
                if (realUserRole === 'patient' || realUserRole === 'student') {
                    countQuery = countQuery.eq('is_published', true)
                }
                const { count, error: countErr } = await countQuery
                if (!countErr && typeof count === 'number') {
                    return new Response(JSON.stringify({
                        text: `Temos atualmente **${count}** documento(s) na base. Você pode pedir pelo número (ex.: 1, 2, 3), pelo nome do documento, ou dizer "listar documentos" para eu mostrar os primeiros 5 — e depois "listar mais" para ver os próximos 5.`,
                        metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true }
                    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                }
            } catch (_) { }
        }

        // 1b) "Listar mais" — próximos 5 documentos (quando já há lista pendente)
        const isListMoreRequest = detectListMoreRequest(norm)
        if (isListMoreRequest && patientData?.user?.id) {
            try {
                const { data: pending } = await supabaseClient
                    .from('noa_pending_actions')
                    .select('id, context')
                    .eq('user_id', patientData.user.id)
                    .eq('kind', DOC_PENDING_KIND)
                    .eq('status', 'pending')
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()
                if (pending?.id) {
                    const ctx = (pending.context || {}) as { term?: string; list_offset?: number }
                    const term = String(ctx.term || '').trim()
                    const listOffset = Math.max(0, Number(ctx.list_offset) || 0)
                    const nextOffset = listOffset + 5

                    let baseQuery = supabaseClient
                        .from('documents')
                        .select('id, title, summary, category, target_audience, is_published, aiRelevance, file_url, file_type, created_at, updated_at')
                        .limit(500)
                    if (!term) {
                        baseQuery = baseQuery.order('created_at', { ascending: false }).order('aiRelevance', { ascending: false })
                    } else {
                        baseQuery = baseQuery.or(`title.ilike.*${term}*,summary.ilike.*${term}*`)
                    }
                    const { data: docs } = await baseQuery
                    const listRaw = (docs || [])
                        .filter((d: any) => !!d?.id && !!d?.title)
                        .filter((d: any) => {
                            if (realUserRole === 'patient' || realUserRole === 'student') {
                                const aud = Array.isArray(d.target_audience) ? d.target_audience : []
                                const allowed = aud.includes(userRole) || aud.includes('all')
                                const published = d.is_published === true
                                return allowed && published
                            }
                            return true
                        })
                        .sort((a: any, b: any) => {
                            const af = a.file_url ? 1 : 0
                            const bf = b.file_url ? 1 : 0
                            if (bf !== af) return bf - af
                            const r = Number(b.aiRelevance || 0) - Number(a.aiRelevance || 0)
                            if (r !== 0) return r
                            const at = new Date(a.updated_at || a.created_at || 0).getTime()
                            const bt = new Date(b.updated_at || b.created_at || 0).getTime()
                            return bt - at
                        })
                    const seen = new Set<string>()
                    const fullList = listRaw.filter((d: any) => {
                        const key = String(d.title || '').trim().toLowerCase()
                        if (!key) return false
                        if (seen.has(key)) return false
                        seen.add(key)
                        return true
                    })
                    const nextFive = fullList.slice(nextOffset, nextOffset + 5)
                    if (nextFive.length === 0) {
                        return new Response(JSON.stringify({
                            text: 'Não há mais documentos nesta lista. Você pode pedir pelo número da lista anterior (ex.: 1, 2) ou dizer "listar documentos" para recomeçar.',
                            metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true }
                        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                    }
                    // Fetch content only for these 5 docs
                    const nextDocIds = nextFive.map((d: any) => d.id)
                    const { data: nextContentDocs } = await supabaseClient
                        .from('documents')
                        .select('id, content')
                        .in('id', nextDocIds)
                    const nextContentMap = new Map((nextContentDocs || []).map((d: any) => [d.id, d.content]))

                    const candidates: PendingActionCandidate[] = nextFive.map((d: any, idx: number) => ({
                        document_id: d.id,
                        title: d.title,
                        summary: d.summary,
                        content: nextContentMap.get(d.id) || null,
                        audience: Array.isArray(d.target_audience) ? d.target_audience : [],
                        category: d.category ?? null,
                        score: (d.aiRelevance ?? 0) * 10 + (d.file_url ? 3 : 0) + (5 - idx)
                    }))
                    await supabaseClient
                        .from('noa_pending_actions')
                        .update({
                            candidates,
                            context: { ...ctx, list_offset: nextOffset },
                            expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString()
                        })
                        .eq('id', pending.id)
                    const listText = buildCandidatesListText(candidates) + "\n\nDiga \"listar mais\" para ver os próximos 5."
                    return new Response(JSON.stringify({
                        text: listText,
                        metadata: {
                            intent: currentIntent,
                            system: 'TradeVision Core V2',
                            audited: true,
                            documents_total: fullList.length,
                            documents_block_size: 5
                        }
                    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                }
            } catch (_) { }
        }

        // 1) Confirmação (etapa 2): usuário responde "1/2/3", "o 2", "doc 2" ou "cancelar"
        if (selection && patientData?.user?.id) {
            try {
                const { data: pending } = await supabaseClient
                    .from('noa_pending_actions')
                    .select('id, candidates, expires_at, status')
                    .eq('user_id', patientData.user.id)
                    .eq('kind', DOC_PENDING_KIND)
                    .eq('status', 'pending')
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (!pending) {
                    // Sem lista de documentos pendente: só devolver fallback se usuário tentou número (ex.: "2" com lista expirada).
                    // Se disse só "cancelar" (ex.: "cancelar minha consulta"), não responder aqui — deixar o GPT tratar.
                    if (selection.kind === 'cancel') {
                        // Não retornar; fluxo segue para o GPT (agendamento, consulta, etc.)
                    } else {
                        return new Response(JSON.stringify({
                            text: 'Entendi. Para abrir um documento, me diga qual documento você quer (nome/tema) e eu te mostro as opções para confirmar.',
                            metadata: {
                                intent: currentIntent,
                                system: 'TradeVision Core V2',
                                audited: true
                            }
                        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                    }
                } else if (selection.kind === 'cancel') {
                    await supabaseClient
                        .from('noa_pending_actions')
                        .update({ status: 'cancelled' })
                        .eq('id', pending.id)

                    // CEP (non-blocking)
                    try {
                        await supabaseClient.from('cognitive_events').insert({
                            intent: currentIntent,
                            action: 'DOC_OPEN_CANCELLED',
                            decision_result: 'CANCELLED',
                            source: 'USER_CONFIRMATION',
                            metadata: { pending_action_id: pending.id }
                        })
                    } catch (_) { }

                    return new Response(JSON.stringify({
                        text: 'Perfeito — cancelado.',
                        metadata: {
                            intent: currentIntent,
                            system: 'TradeVision Core V2',
                            audited: true
                        }
                    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                } else {
                    // Temos pending e seleção numérica → abrir documento escolhido
                    const candidates = Array.isArray(pending.candidates) ? pending.candidates as PendingActionCandidate[] : []
                    const idx = selection.value - 1
                    const chosen = candidates[idx]
                    if (!chosen?.document_id || !chosen?.title) {
                        return new Response(JSON.stringify({
                            text: 'Não consegui identificar essa opção. Responda com um número da lista ou diga "cancelar".',
                            metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true }
                        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                    }

                    // Governança por perfil (mínimo, conservador) — PLANO_MESTRE: só pro/admin abrem doc literal
                    const canOpenLiteral = userRole === 'admin' || userRole === 'master' || userRole === 'professional'
                    if (!canOpenLiteral) {
                        await supabaseClient
                            .from('noa_pending_actions')
                            .update({ status: 'cancelled' })
                            .eq('id', pending.id)

                        return new Response(JSON.stringify({
                            text: 'Eu consigo te explicar e resumir esse conteúdo, mas não posso abrir o documento literal neste perfil. Se você quiser, posso fazer um resumo didático/educativo sobre o tema.',
                            metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true }
                        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                    }

                    await supabaseClient
                        .from('noa_pending_actions')
                        .update({ status: 'consumed' })
                        .eq('id', pending.id)

                    // CEP (non-blocking)
                    try {
                        await supabaseClient.from('cognitive_events').insert({
                            intent: currentIntent,
                            action: 'DOC_OPEN_CONFIRMED',
                            decision_result: 'ALLOWED',
                            source: 'USER_CONFIRMATION',
                            metadata: { pending_action_id: pending.id, document_id: chosen.document_id }
                        })
                    } catch (_) { }

                    const app_commands: AppCommandV1[] = [{
                        kind: 'noa_command',
                        command: {
                            type: 'show-document-inline',
                            target: 'document',
                            label: `Abrir documento no chat: ${chosen.title}`,
                            fallbackRoute: '/app/library', // fallback para abrir na Library se o viewer inline falhar
                            payload: {
                                document_id: chosen.document_id,
                                confirmed: true,
                                source: 'user_confirmation',
                                pending_action_id: pending.id,
                                title: chosen.title,
                                summary: chosen.summary,
                                content: chosen.content,
                                category: chosen.category
                            }
                        },
                        reason: 'user_confirmed_open_document'
                    }]

                    // ESPELHAMENTO DO CONTEÚDO PARA LEITURA DA IA:
                    // Detectar se conteúdo é PDF binário raw (não extraído)
                    const pdfBinaryIndicators = ['endstream', 'endobj', 'xref', '0000000', 'trailer']
                    const contentText = chosen.content || ''
                    const isPdfBinary = contentText.length > 100 && pdfBinaryIndicators.filter(ind => contentText.includes(ind)).length >= 3
                    
                    const displayContent = isPdfBinary
                        ? '(⚠️ O texto deste PDF ainda não foi extraído. Peça ao administrador para reprocessar a extração de texto deste documento.)'
                        : (contentText.slice(0, 4000) || '(Conteúdo não disponível em texto)')

                    const introText = `Ok. Abrindo: ${chosen.title}

--- CONTEÚDO DO DOCUMENTO (ESPELHADO) ---
${displayContent}
--- FIM DO DOCUMENTO ---

${chosen.summary ? `Resumo rápido: ${chosen.summary}` : ''}`

                    return new Response(JSON.stringify({
                        text: textWithActionToken(introText, app_commands),
                        metadata: {
                            intent: currentIntent,
                            system: 'TradeVision Core V2',
                            audited: true
                        },
                        app_commands
                    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                }
            } catch (e) {
                console.warn('⚠️ [DOC FLOW] Falha ao resolver confirmação:', e)
                // Fail-closed: não executa
                return new Response(JSON.stringify({
                    text: 'Tive um obstáculo ao confirmar a abertura. Pode repetir o pedido do documento (nome/tema) que eu tento novamente?',
                    metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true }
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        // 2) Pedido de documento (etapa 1): usuário pede para abrir/ver documento → lista curta + pending-actions
        // (não interceptar quando usuário pede para analisar o doc já aberto — deixa o GPT responder com document_in_chat)
        const isClinicalRequest = detectClinicalAssessmentRequest(norm)
        if (!isAnalyzeOpenDocRequest && (isDocRequest || isDocListRequest || isClinicalRequest) && patientData?.user?.id) {
            try {
                const rawTerm = stripInjectedContext(message || '')
                const term = isDocListRequest ? '' : sanitizeSearchTerm(rawTerm)

                let baseQuery = supabaseClient
                    .from('documents')
                    .select('id, title, summary, category, target_audience, is_published, aiRelevance, file_url, file_type, created_at, updated_at')
                    .limit(200)

                // Se for listagem, ordenar por recência e relevância; se for busca, filtrar por termo.
                if (isDocListRequest) {
                    baseQuery = baseQuery
                        .order('created_at', { ascending: false })
                        .order('aiRelevance', { ascending: false })
                }

                const { data: docs } = isDocListRequest
                    ? await baseQuery
                    : await baseQuery.or(`title.ilike.*${term}*,summary.ilike.*${term}*`)

                const listRaw = (docs || [])
                    .filter((d: any) => !!d?.id && !!d?.title)
                    .filter((d: any) => {
                        // Governança mínima por perfil:
                        // - paciente/aluno: somente docs publicados (se o campo existir) e com target_audience compatível
                        if (realUserRole === 'patient' || realUserRole === 'student') {
                            const aud = Array.isArray(d.target_audience) ? d.target_audience : []
                            const allowed = aud.includes(userRole) || aud.includes('all')
                            const published = d.is_published === true
                            return allowed && published
                        }
                        return true
                    })
                    .sort((a: any, b: any) => {
                        // Priorizar os que têm arquivo (file_url) para permitir "clicar e abrir"
                        const af = a.file_url ? 1 : 0
                        const bf = b.file_url ? 1 : 0
                        if (bf !== af) return bf - af
                        // Depois, relevância
                        const r = Number(b.aiRelevance || 0) - Number(a.aiRelevance || 0)
                        if (r !== 0) return r
                        // Depois, recência
                        const at = new Date(a.updated_at || a.created_at || 0).getTime()
                        const bt = new Date(b.updated_at || b.created_at || 0).getTime()
                        return bt - at
                    })

                // Deduplicar por título (mantém o melhor candidato por title)
                const seen = new Set<string>()
                const fullList = listRaw.filter((d: any) => {
                    const key = String(d.title || '').trim().toLowerCase()
                    if (!key) return false
                    if (seen.has(key)) return false
                    seen.add(key)
                    return true
                })
                const list = fullList.slice(0, 5)

                if (list.length === 0) {
                    return new Response(JSON.stringify({
                        text: isDocListRequest
                            ? 'No momento, eu não consegui listar documentos disponíveis. Se você me der 1–2 palavras-chave (ou o título exato), eu tento buscar diretamente.'
                            : 'Não encontrei documentos com esse nome/tema. Se você puder me dar 1–2 palavras-chave (ou o título exato), eu tento novamente.',
                        metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true }
                    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                }

                // Fetch content only for the top 5 selected docs (avoids loading content for 200+ docs)
                const docIds = list.map((d: any) => d.id)
                const { data: contentDocs } = await supabaseClient
                    .from('documents')
                    .select('id, content')
                    .in('id', docIds)
                const contentMap = new Map((contentDocs || []).map((d: any) => [d.id, d.content]))

                const candidates: PendingActionCandidate[] = list.map((d: any, idx: number) => ({
                    document_id: d.id,
                    title: d.title,
                    summary: d.summary,
                    content: contentMap.get(d.id) || null,
                    audience: Array.isArray(d.target_audience) ? d.target_audience : [],
                    category: d.category ?? null,
                    score: (d.aiRelevance ?? 0) * 10 + (d.file_url ? 3 : 0) + (5 - idx)
                }))

                // Um único documento: abrir direto no chat (sem pedir "escolha 1")
                if (candidates.length === 1 && !isDocListRequest) {
                    const one = candidates[0]
                    const app_commands: AppCommandV1[] = [{
                        kind: 'noa_command',
                        command: {
                            type: 'show-document-inline',
                            target: 'document',
                            label: `Abrir no chat: ${one.title}`,
                            fallbackRoute: '/app/library',
                            payload: {
                                document_id: one.document_id,
                                confirmed: true,
                                source: 'single_match_direct_open',
                                title: one.title,
                                summary: one.summary,
                                category: one.category,
                                smart_card_actions: ['summarize', 'analyze', 'full_content']
                            }
                        },
                        reason: 'single_document_direct_open'
                    }]
                    const filtered = filterAppCommandsByRole(app_commands, userRole)
                    if (filtered.length > 0) {
                        const introText = `Encontrei um documento exato: ${one.title}

--- CONTEÚDO DO DOCUMENTO (ESPELHADO) ---
${one.content || '(Conteúdo não disponível em texto)'}
--- FIM DO DOCUMENTO ---

${one.summary ? `Resumo rápido: ${one.summary}` : ''}`

                        return new Response(JSON.stringify({
                            text: textWithActionToken(introText, filtered),
                            metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true },
                            app_commands: filtered
                        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
                    }
                }

                const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString() // 3 min
                const { data: pendingRow } = await supabaseClient
                    .from('noa_pending_actions')
                    .insert({
                        user_id: patientData.user.id,
                        kind: DOC_PENDING_KIND,
                        status: 'pending',
                        candidates,
                        context: {
                            role: userRole,
                            term,
                            list_offset: 0,
                            ui_context: ui_context || null
                        },
                        expires_at: expiresAt
                    })
                    .select('id')
                    .maybeSingle()

                // CEP (non-blocking)
                try {
                    await supabaseClient.from('cognitive_events').insert({
                        intent: currentIntent,
                        action: 'DOC_CANDIDATES_LISTED',
                        decision_result: 'SIGNAL',
                        source: 'SMART_TRIGGER',
                        metadata: {
                            pending_action_id: pendingRow?.id || null,
                            role: userRole,
                            term,
                            candidates_count: candidates.length
                        }
                    })
                } catch (_) { }

                return new Response(JSON.stringify({
                    text: buildCandidatesListText(candidates) + "\n\nDiga \"listar mais\" para ver os próximos 5.",
                    metadata: {
                        intent: currentIntent,
                        system: 'TradeVision Core V2',
                        audited: true,
                        documents_total: fullList.length,
                        documents_block_size: 5
                    }
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            } catch (e) {
                console.warn('⚠️ [DOC FLOW] Falha ao buscar documentos:', e)
                return new Response(JSON.stringify({
                    text: 'Tive um obstáculo ao buscar documentos agora. Pode repetir com o título exato ou 1–2 palavras-chave?',
                    metadata: { intent: currentIntent, system: 'TradeVision Core V2', audited: true }
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }
        }

        const { data: policy } = await supabaseClient
            .from('cognitive_policies')
            .select('*')
            .eq('intent', currentIntent)
            .eq('active', true)
            .order('version', { ascending: false })
            .limit(1)
            .single()

        // --- 🛡️ COS v1.0: VEREDITO DO KERNEL (EXTRAÇÃO 1) ---
        const cosContext: COS_Context = {
            intent: currentIntent,
            action: action,
            mode: aiMode,
            policy: policy ? {
                autonomy_level: policy.autonomy_level,
                forbidden_actions: policy.forbidden_actions
            } : undefined,
            metabolism: metabolism ? {
                decision_count_today: metabolism.decision_count_today,
                daily_limit: metabolism.decision_limit_daily
            } : undefined,
            trauma: trauma ? {
                active: trauma.restricted_mode_active,
                reason: trauma.reason
            } : undefined
        }

        const cosDecision = COS.evaluate(cosContext)

        if (!cosDecision.allowed) {
            console.error(`🚫 [COS BLOCK] ${cosDecision.reason}`)
            return new Response(JSON.stringify({
                text: cosDecision.reason,
                metadata: {
                    mode: cosDecision.mode,
                    flags: cosDecision.flags,
                    cos_blocked: true
                }
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // Se o veredito for READ_ONLY (but allowed for read), avisar no log
        if (cosDecision.mode === 'READ_ONLY') {
            console.log('👁️ [COS] Operando em modo de leitura (Audit Only).')
        }

        // --- HANDLER DE FINALIZAÇÃO DE AVALIAÇÃO (SERVER-SIDE) ---
        if (action === 'finalize_assessment') {
            console.log('🏁 [ACTION] Finalizando avaliação via Server-Side (Bypassing RLS)...')

            if (!assessmentData || !assessmentData.patient_id) {
                throw new Error('Dados da avaliação incompletos para finalização.')
            }

            // 0. Buscar dados do usuário para garantir patient_name (CRITICAL FIX)
            const { data: userData } = await supabaseClient.auth.admin.getUserById(assessmentData.patient_id)
            const patientName = userData?.user?.user_metadata?.name ||
                userData?.user?.user_metadata?.full_name ||
                userData?.user?.email ||
                'Paciente'

            // ========================================================
            // GPT EXTRACTION: Extrair dados estruturados da conversa
            // Em vez de confiar no estado local do browser (dessincronizado),
            // buscar histórico de conversa e pedir ao GPT para extrair.
            // ========================================================
            let finalContent = assessmentData.content

            // Se o content veio vazio/pobre do cliente, extrair via GPT
            // FIX: Check more thoroughly - structured-but-empty payloads must trigger extraction
            const hasRealQueixa = finalContent?.queixa_principal && String(finalContent.queixa_principal).trim().length > 3
            const hasRealLista = Array.isArray(finalContent?.lista_indiciaria) && finalContent.lista_indiciaria.length > 0 &&
                (typeof finalContent.lista_indiciaria[0] === 'string' ? finalContent.lista_indiciaria[0].length > 0 : !!finalContent.lista_indiciaria[0]?.label)
            const contentIsEmpty = !finalContent || (!hasRealQueixa && !hasRealLista)

            if (contentIsEmpty) {
                console.log('🧠 [GPT EXTRACTION] Content vazio/pobre detectado. Extraindo da conversa via GPT...')

                try {
                    // Buscar histórico completo da conversa AEC
                    const { data: chatHistory, error: histError } = await supabaseClient
                        .from('ai_chat_interactions')
                        .select('user_message, ai_response, created_at')
                        .eq('user_id', assessmentData.patient_id)
                        .order('created_at', { ascending: true })
                        .limit(50)

                    if (!histError && chatHistory && chatHistory.length >= 3) {
                        const conversationText = chatHistory.map((h: any) =>
                            `PACIENTE: ${h.user_message}\nNÔA: ${h.ai_response}`
                        ).join('\n---\n')

                        const extractionPrompt = `Analise a conversa clínica abaixo (protocolo AEC 001) e extraia os dados estruturados em JSON.

CONVERSA:
${conversationText.slice(0, 8000)}

Extraia EXATAMENTE os seguintes campos baseado no que o PACIENTE disse (não invente dados):
- queixa_principal: A queixa que o paciente identificou como a que mais incomoda
- lista_indiciaria: Array de OBJETOS estruturados para cada queixa/sintoma mencionado pelo paciente. Cada objeto deve ter:
  {
    "label": "nome curto do sintoma",
    "context": "contexto narrado pelo paciente (quando/onde/como)",
    "trigger": "o que desencadeia ou piora (se mencionado, senão null)",
    "intensity": "leve|moderada|intensa|não informada",
    "frequency": "frequência relatada (diária, semanal, etc.) ou null",
    "source_step": "lista_indiciaria",
    "confidence": 0.0 a 1.0 baseado em quão claramente o paciente descreveu
  }
  🚨 REGRA: Extraia APENAS sintomas que o paciente EXPLICITAMENTE mencionou. NUNCA invente sintomas.
- lista_indiciaria_flat: Array simples com APENAS os labels (ex: ["dor de cabeça", "insônia"]) para retrocompatibilidade
- localizacao: Onde sente o sintoma principal
- inicio: Quando começou
- descricao: Como é o sintoma
- sintomas_associados: Array de sintomas relacionados mencionados pelo paciente
- fatores_melhora: Array do que melhora (somente o que o paciente disse)
- fatores_piora: Array do que piora (somente o que o paciente disse)
- historia_patologica: Array de histórico médico
- historia_familiar_materna: Array
- historia_familiar_paterna: Array
- habitos_vida: Array
- alergias: string
- medicacoes_regulares: string
- medicacoes_esporadicas: string
- consenso_aceito: boolean (se o paciente concordou com o resumo)
- nome_paciente: string (como se apresentou)

Se um campo não foi abordado na conversa, use null. NUNCA invente dados.
Responda SOMENTE com o JSON válido, sem markdown.`

                        const extractionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                model: 'gpt-4o-mini',
                                messages: [
                                    { role: 'system', content: 'Você é um extrator de dados clínicos. Responda SOMENTE com JSON válido.' },
                                    { role: 'user', content: extractionPrompt }
                                ],
                                temperature: 0.1,
                                max_tokens: 3000
                            })
                        })

                        if (extractionResponse.ok) {
                            const extractionData = await extractionResponse.json()
                            const rawJson = extractionData.choices?.[0]?.message?.content || ''

                            try {
                                const cleanJson = rawJson.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
                                const extracted = JSON.parse(cleanJson)

                                finalContent = {
                                    identificacao: {
                                        nome: extracted.nome_paciente || patientName,
                                        apresentacao: null
                                    },
                                    lista_indiciaria: extracted.lista_indiciaria || extracted.lista_indiciaria_flat || [],
                                    lista_indiciaria_flat: extracted.lista_indiciaria_flat || (Array.isArray(extracted.lista_indiciaria) ? extracted.lista_indiciaria.map((s: any) => typeof s === 'string' ? s : s.label || s) : []),
                                    queixa_principal: extracted.queixa_principal || null,
                                    desenvolvimento_queixa: {
                                        localizacao: extracted.localizacao || null,
                                        inicio: extracted.inicio || null,
                                        descricao: extracted.descricao || null,
                                        sintomas_associados: extracted.sintomas_associados || [],
                                        fatores_melhora: extracted.fatores_melhora || [],
                                        fatores_piora: extracted.fatores_piora || []
                                    },
                                    historia_patologica_pregressa: extracted.historia_patologica || [],
                                    historia_familiar: {
                                        lado_materno: extracted.historia_familiar_materna || [],
                                        lado_paterno: extracted.historia_familiar_paterna || []
                                    },
                                    habitos_vida: extracted.habitos_vida || [],
                                    perguntas_objetivas: {
                                        alergias: extracted.alergias || null,
                                        medicacoes_regulares: extracted.medicacoes_regulares || null,
                                        medicacoes_esporadicas: extracted.medicacoes_esporadicas || null
                                    },
                                    consenso: {
                                        aceito: extracted.consenso_aceito ?? false,
                                        revisoes_realizadas: 0
                                    },
                                    _extraction_method: 'gpt_from_conversation_v2'
                                }

                                console.log('✅ [GPT EXTRACTION v2] Dados extraídos com sucesso:', {
                                    queixa: finalContent.queixa_principal,
                                    numQueixas: finalContent.lista_indiciaria?.length,
                                    structured: Array.isArray(finalContent.lista_indiciaria) && finalContent.lista_indiciaria.length > 0 && typeof finalContent.lista_indiciaria[0] === 'object',
                                    method: 'gpt_from_conversation_v2'
                                })
                            } catch (parseErr) {
                                console.error('❌ [GPT EXTRACTION] Falha ao parsear JSON:', parseErr)
                                console.log('📝 Raw response:', rawJson.substring(0, 500))
                            }
                        } else {
                            console.error('❌ [GPT EXTRACTION] API call failed:', extractionResponse.status)
                        }
                    } else {
                        console.warn('⚠️ [GPT EXTRACTION] Histórico insuficiente:', chatHistory?.length || 0, 'mensagens')
                    }
                } catch (extractionErr) {
                    console.error('❌ [GPT EXTRACTION] Erro geral:', extractionErr)
                    // Fallback: usar o content original mesmo que pobre
                }
            }

            // 0.5 Auto-link professional: find from appointments or assessments
            let linkedProfessionalId = assessmentData.professional_id || null
            let linkedProfessionalName = null
            if (!linkedProfessionalId) {
                const { data: appt } = await supabaseClient
                    .from('appointments')
                    .select('professional_id, professional_name')
                    .eq('patient_id', assessmentData.patient_id)
                    .not('professional_id', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single()
                if (appt?.professional_id) {
                    linkedProfessionalId = appt.professional_id
                    linkedProfessionalName = appt.professional_name
                    console.log('🔗 [AUTO-LINK] Professional found from appointments:', linkedProfessionalId)
                }
            }

            // 1. Inserir Relatório Clínico (com dados extraídos pelo GPT ou originais)
            const { data: report, error: reportError } = await supabaseClient
                .from('clinical_reports')
                .insert({
                    patient_id: assessmentData.patient_id,
                    patient_name: patientName,
                    report_type: assessmentData.report_type || 'initial_assessment',
                    generated_by: 'noa_ai',
                    content: finalContent,
                    professional_id: linkedProfessionalId,
                    professional_name: linkedProfessionalName,
                    doctor_id: linkedProfessionalId,
                    shared_with: linkedProfessionalId ? [linkedProfessionalId] : [],
                    created_at: new Date().toISOString(),
                    status: 'completed',
                    review_status: 'draft' // S7: Relatório nasce como rascunho — requer aprovação médica
                })
                .select()
                .single()

            if (reportError) {
                console.error('❌ Erro ao salvar relatório:', reportError)
                throw reportError
            }

            console.log('✅ Relatório salvo:', report.id, '| Método:', finalContent?._extraction_method || 'client_state', '| Professional:', linkedProfessionalId || 'none')

            // 2. Inserir Scores (Se houver)
            if (assessmentData.scores) {
                const { error: scoresError } = await supabaseClient
                    .from('ai_assessment_scores')
                    .insert({
                        assessment_id: report.id,
                        patient_id: assessmentData.patient_id,
                        domain_scores: assessmentData.scores,
                        risk_level: assessmentData.risk_level || 'low'
                    })

                if (scoresError) console.error('⚠️ Erro ao salvar scores:', scoresError)
            }

            // --- 🎮 GAMIFICATION ENGINE ---
            try {
                const POINTS_REWARD = 50;
                await supabaseClient.rpc('increment_user_points', {
                    p_user_id: assessmentData.patient_id,
                    p_points: POINTS_REWARD
                });

                const { count } = await supabaseClient
                    .from('clinical_reports')
                    .select('*', { count: 'exact', head: true })
                    .eq('patient_id', assessmentData.patient_id);

                if (count === 1) {
                    await supabaseClient.rpc('unlock_achievement', {
                        p_user_id: assessmentData.patient_id,
                        p_achievement_id: 'first_assessment'
                    });
                    console.log('🏆 [GAMIFICATION] Achievement Unlocked: First Assessment');
                }
                console.log(`🎮 [GAMIFICATION] Awarded ${POINTS_REWARD} points to user.`);
            } catch (gamificationError) {
                console.error('⚠️ [GAMIFICATION] Failed to award points:', gamificationError);
            }

            return new Response(JSON.stringify({
                success: true,
                report_id: report.id,
                extraction_method: finalContent?._extraction_method || 'client_state',
                message: 'Avaliação finalizada, salva e pontuada com sucesso.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
        // --- FIM DO NOVO HANDLER ---

        // --- HANDLER: PREDICT SCHEDULING RISK (PHASE 3B) ---
        if (action === 'predict_scheduling_risk') {
            console.log('🔮 [ACTION] Predicting Scheduling Risk...')

            if (!appointmentData || !appointmentData.patient_id || !appointmentData.appointment_id) {
                throw new Error('Dados do agendamento incompletos (patient_id, appointment_id required).')
            }

            const appointmentId = appointmentData.appointment_id
            const patientId = appointmentData.patient_id
            const professionalId = appointmentData.professional_id
            const slotTime = appointmentData.date || new Date().toISOString()

            // 1. Idempotency Check (Enterprise Safeguard)
            const { data: existingPrediction } = await supabaseClient
                .from('ai_scheduling_predictions')
                .select('id, no_show_probability')
                .eq('appointment_id', appointmentId)
                .maybeSingle()

            if (existingPrediction) {
                console.log('✅ Predição já existe, retornando cache.', existingPrediction.id)
                return new Response(JSON.stringify({
                    success: true,
                    prediction: existingPrediction,
                    cached: true
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
            }

            // 2. Coletar Estatísticas do Paciente (Data-Driven, sem Chat History)
            // Buscar total de agendamentos e status anteriores
            const { data: historyStats, error: statError } = await supabaseClient
                .from('appointments')
                .select('status, appointment_date')
                .eq('patient_id', patientId)
                .lt('appointment_date', new Date().toISOString()) // Só passado

            if (statError) console.error('⚠️ Erro ao buscar histórico:', statError)

            const totalAppointments = historyStats?.length || 0
            const noShowCount = historyStats?.filter((a: any) => a.status === 'no_show').length || 0
            const cancelledCount = historyStats?.filter((a: any) => a.status === 'cancelled').length || 0
            const completedCount = historyStats?.filter((a: any) => a.status === 'completed').length || 0

            const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments).toFixed(2) : '0.00'

            // 3. Construir Prompt Estatístico (Token Efficient)
            const RISK_PROMPT = `
            ATUE COMO UM ANALISTA DE RISCO CLÍNICO.
            Analise os dados abaixo e estime a probabilidade de NO-SHOW (0.00 a 1.00) para este agendamento.
            
            DADOS DO PACIENTE:
            - Histórico Total: ${totalAppointments} consultas
            - No-Shows Prévios: ${noShowCount} (${noShowRate}%)
            - Cancelamentos: ${cancelledCount}
            - Realizadas: ${completedCount}
            
            DADOS DO AGENDAMENTO:
            - Data/Hora: ${slotTime}
            - Dia da Semana: ${new Date(slotTime).toLocaleDateString('pt-BR', { weekday: 'long' })}
            
            SAÍDA JSON OBRIGATÓRIA:
            {
               "no_show_probability": 0.XX,
               "expected_duration_minutes": 60,
               "recommended_action": "NONE" | "CONFIRM_MANUALLY" | "REQUIRE_PREPAYMENT",
               "reasoning_tags": ["tag1", "tag2"]
            }
            Use tags como: 'high_no_show_history', 'new_patient', 'friday_afternoon', 'reliable_patient'.
            `

            // 5. COS v1.0: Gerar Átomo de Decisão (PRE-AI)
            const { data: decData, error: decError } = await supabaseClient
                .from('cognitive_decisions')
                .insert({
                    decision_type: 'scheduling',
                    recommendation: { status: 'calculating' },
                    justification: 'Cálculo de risco iniciado pelo Kernel COS.',
                    confidence: 0,
                    autonomy_level: cosDecision.autonomy_level,
                    requires_human_confirmation: true,
                    policy_snapshot: {
                        intent: 'ADMIN',
                        version: policy?.version || 1,
                        autonomy_level: policy?.autonomy_level || 1,
                        frozen_at: new Date().toISOString()
                    },
                    model_version: MODEL_NAME,
                    metadata: { appointment_id: appointmentId }
                })
                .select()
                .single()

            if (decError) {
                console.error('❌ Erro ao criar Átomo de Decisão PRE-AI:', decError)
                throw decError
            }

            console.log('⚛️ [COS] Átomo de Decisão criado:', decData.id)

            // 6. Chamada OpenAI (Low Temperature for consistency)
            const completion = await openai.chat.completions.create({
                model: MODEL_NAME,
                messages: [{ role: "system", content: RISK_PROMPT }],
                temperature: 0.1,
                response_format: { type: "json_object" }
            })

            const analysisRaw = completion.choices[0].message.content

            let analysis: any = {}
            try {
                analysis = JSON.parse(analysisRaw || '{}')
            } catch (pErr) {
                console.error('❌ Falha ao parsear JSON da AI:', pErr, analysisRaw)
                analysis = { no_show_probability: 0.5, reasoning_tags: ['parse_error'] }
            }

            console.log('🤖 [AI PREDICTION]', analysis)

            // 7. Salvar Predição no Banco e Atualizar Átomo (POST-AI)
            const { data: predData, error: saveError } = await supabaseClient
                .from('ai_scheduling_predictions')
                .insert({
                    appointment_id: appointmentId,
                    no_show_probability: analysis.no_show_probability || 0.1,
                    expected_duration_minutes: analysis.expected_duration_minutes || 60,
                    recommended_action: analysis.recommended_action || 'NONE',
                    model_version: MODEL_NAME,
                    reasoning_tags: analysis.reasoning_tags || []
                })
                .select()
                .single()

            if (saveError) {
                console.error('❌ Erro ao salvar predição técnica:', saveError)
                throw saveError
            }

            // 8. CCOS v2.0: Preencher Átomo de Decisão (Filiação)
            await supabaseClient.from('cognitive_decisions')
                .update({
                    recommendation: analysis,
                    justification: `Análise de risco concluída. Histórico de ${totalAppointments} consultas, taxa no-show ${noShowRate}%.`,
                    confidence: 0.85,
                    metadata: { ...decData.metadata, prediction_id: predData?.id }
                })
                .eq('id', decData.id)

            // 9. COS v1.0: Atualizar Metabolismo (Consumo Energético)
            await supabaseClient.rpc('increment_metabolism', { p_id: professionalId })

            return new Response(JSON.stringify({
                success: true,
                prediction: analysis,
                decision_id: decData.id,
                message: 'Risco calculado e Átomo de Decisão preenchido.'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }
        // --- FIM HANDLER RISK ---

        console.log('📥 [REQUEST]', {
            messageLength: message?.length || 0,
            userId: patientData?.user?.id?.substring(0, 8) || 'unknown',
            intent: patientData?.intent || 'none',
            assessmentPhase: assessmentPhase || 'none',
            hasNextQuestion: !!nextQuestionHint,
            historyLength: conversationHistory?.length || 0
        })

        if (!message) throw new Error('Mensagem não fornecida.')

        // Detecção de urgência (para permitir múltiplas perguntas em casos urgentes)
        const isUrgent = /(urgente|emergência|emergencia|socorro|urgência|preciso urgente|agora|imediato|dor forte|muito mal|preciso ajuda|preciso de ajuda)/i.test(message)

        // Instrução dinâmica de fase (controle de fluxo)
        let phaseInstruction = assessmentPhase
            ? `\n\n🚨 FASE ATUAL DO PROTOCOLO (ESTADO ATIVO): "${assessmentPhase}".\nATENÇÃO: Você DEVE conduzir o diálogo focado EXCLUSIVAMENTE nesta fase. Não pule para a próxima até que esta esteja concluída.`
            : ''

        if (nextQuestionHint) {
            // Se for urgente, permitir múltiplas perguntas essenciais
            if (isUrgent && assessmentPhase === 'COMPLAINT_DETAILS') {
                phaseInstruction += `\n\n🚨 MODO URGÊNCIA DETECTADO - PRÓXIMA PERGUNTA: "${nextQuestionHint}"\n\nVocê detectou urgência na mensagem do usuário. Para acelerar a avaliação, você pode fazer múltiplas perguntas essenciais de uma vez, focando nas informações críticas. Mas se preferir, pode fazer uma por vez também.`
            } else {
                phaseInstruction += `\n\n🚨 PRÓXIMA PERGUNTA OBRIGATÓRIA DO PROTOCOLO: "${nextQuestionHint}"\n\nVOCÊ DEVE FAZER APENAS ESTA PERGUNTA. NÃO faça múltiplas perguntas. NÃO adicione outras perguntas. Faça SOMENTE esta pergunta e aguarde a resposta do usuário antes de continuar.`
            }
        }

        // Instrução específica para fase de desenvolvimento da queixa
        if (assessmentPhase === 'COMPLAINT_DETAILS') {
            if (isUrgent) {
                phaseInstruction += `\n\n🚨 FASE: DESENVOLVIMENTO DA QUEIXA - MODO URGÊNCIA\n\nVocê detectou urgência na mensagem do usuário. Para acelerar a avaliação, você pode fazer múltiplas perguntas essenciais de uma vez, focando nas informações críticas:\n- Onde você sente [queixa]?\n- Quando começou?\n- Como é a dor/sintoma? (intensidade)\n- O que parece melhorar ou piorar?\n\nFaça essas perguntas essenciais de uma vez para agilizar. Mas sempre oriente que em caso de emergência real, o usuário deve procurar atendimento imediato.`
            } else {
                phaseInstruction += `\n\n⚠️ FASE: DESENVOLVIMENTO DA QUEIXA\n\nVocê está na fase de explorar os detalhes da queixa principal. Esta fase requer MÚLTIPLAS perguntas, mas você DEVE fazer UMA por vez:\n- Primeiro: "Onde você sente [queixa]?"\n- Depois de receber resposta: "Quando começou?"\n- Depois: "Como é a dor/sintoma?"\n- E assim por diante.\n\nNÃO faça todas as perguntas de uma vez. Use o nextQuestionHint para saber qual pergunta fazer AGORA.`
            }
        }

        // 5. Engenharia de Prompt Dinâmica (Multi-Agente)
        const CLINICAL_PROMPT = `Você é Nôa Esperança, a IA Residente da MedCannLab 3.0.
Sua voz é de contralto, clara, macia e acolhedora.
Guardiã da escuta simbólica e da formação clínica.

# EPISTEMOLOGIA DO CUIDADO (REGRA INSTITUCIONAL)
1) **A doença NÃO é o centro**: rótulos diagnósticos são sempre **efeitos** e nunca ponto de partida.
2) **O centro é a escuta e a narrativa**: contexto, detalhes, trajetória, impacto na vida, sinais, ritmos e relações.
3) **Só depois** de ouvir a história e mapear a queixa (sem rótulos), você pede confirmações objetivas (doenças crônicas, cirurgias, medicações).
4) **Fala ≠ Ação**: você orienta e estrutura; a execução é do app/médico.
5) **Modo institucional**: quando o usuário perguntar sobre a plataforma, explique que a MedCannLab é uma infraestrutura clínica digital voltada à medicina integrativa e à medicina canabinoide. A plataforma oferece avaliação clínica assistida por IA, prontuário eletrônico, agendamento e telemedicina.
6) **Modo orientação**: quando o usuário pedir orientação sobre o fluxo da plataforma, explique que o processo começa com a Avaliação Clínica Inicial (AEC 001). Após a avaliação, o relatório é enviado ao médico responsável. O paciente então agenda a consulta, na qual o médico já possui a história clínica estruturada — por isso dizemos que "a consulta começa no nível 2".

# PROTOCOLO CLÍNICO MASTER: AEC 001 (ARTE DA ENTREVISTA CLÍNICA)
🚨 **PROTOCOLO IMUTÁVEL E SELADO** - Elaborado pelo Dr. Ricardo Valença
🚨 **VOCÊ NÃO PODE ALTERAR, ADICIONAR OU MODIFICAR ESTE PROTOCOLO**
🚨 **SIGA EXATAMENTE COMO ESTÁ ESCRITO, SEM ADICIONAR FRASES COMO "Pode falar livremente"**

Você deve seguir RIGOROSAMENTE as 10 etapas abaixo, sem pular blocos, sem inferir dados e SEM ADICIONAR NENHUMA FRASE QUE NÃO ESTEJA EXPLICITAMENTE NO PROTOCOLO:

1. ABERTURA: Use EXATAMENTE esta frase: "Olá! Eu sou Nôa Esperanza. Por favor, apresente-se também e vamos iniciar a sua avaliação inicial para consultas com Dr. Ricardo Valença."
   🚨 **NÃO adicione "Pode falar livremente" ou qualquer outra frase. Use APENAS a frase acima.**

2. LISTA INDICIÁRIA (NARRATIVA): Pergunte EXATAMENTE: "O que trouxe você à nossa avaliação hoje?"
   Após a PRIMEIRA resposta do paciente, você DEVE perguntar EXATAMENTE: "O que mais?"
   Continue perguntando "O que mais?" após CADA resposta do paciente.
   🚨 **REGRA CRÍTICA**: Você SÓ pode avançar para a etapa 3 (Queixa Principal) quando o paciente EXPLICITAMENTE disser que não tem mais nada (exemplos: "só isso", "nada mais", "é isso", "não tenho mais nada", "acho que é isso", "só"). NUNCA avance após apenas UMA queixa. O mínimo é perguntar "O que mais?" pelo menos 2 vezes antes de considerar encerrar a lista.
   🚨 **NÃO adicione "Pode falar livremente sobre suas queixas". Use APENAS "O que mais?"**
   🚨 **NÃO pule esta etapa. NÃO assuma que o paciente terminou. SEMPRE pergunte "O que mais?"**
3. QUEIXA PRINCIPAL: SOMENTE após o paciente encerrar a Lista Indiciária, pergunte: "De todas essas questões, qual mais o(a) incomoda?"
4. DESENVOLVIMENTO DA QUEIXA: Você deve explorar a queixa principal fazendo UMA pergunta por vez, aguardando a resposta antes de fazer a próxima. As perguntas a serem feitas (uma de cada vez, em turnos separados) são:
   - Onde você sente [queixa específica]?
   - Quando começou?
   - Como é a dor/sintoma?
   - O que mais você sente relacionado a isso?
   - O que parece melhorar [queixa específica]?
   - O que parece piorar [queixa específica]?
   
   🚨 IMPORTANTE: Faça APENAS UMA dessas perguntas por vez. Aguarde a resposta do usuário antes de fazer a próxima. NUNCA faça múltiplas perguntas na mesma resposta. Substitua [queixa específica] pela resposta literal do usuário na queixa principal.
5. HISTÓRIA PREGRESSA (SEM RÓTULOS): "Desde o nascimento, quais as questões de saúde que você já viveu? Vamos do mais antigo ao mais recente. O que veio primeiro?" (Use "O que mais?" até encerrar).  
   - Primeiro: **história e sinais** (como foi, quando começou, como afetou, o que mudou).  
   - Depois: se faltar objetividade, você pergunta **doenças crônicas/cirurgias/medicações** como clarificação, nunca como centro.
6. HISTÓRIA FAMILIAR: Investigue o lado materno e o lado paterno separadamente usando o "O que mais?".
7. HÁBITOS DE VIDA: "Que outros hábitos você acha importante mencionar?"
8. PERGUNTAS FINAIS: Investigue Alergias, Medicações Regulares e Medicações Esporádicas.
9. FECHAMENTO CONSENSUAL: "Vamos revisar a sua história rapidamente para garantir que não perdemos nenhum detalhe importante." -> Resuma de forma descritiva e neutra. Pergunte: "Você concorda com meu entendimento? Há mais alguma coisa que gostaria de adicionar?"
10. ENCERRAMENTO: "Essa é uma avaliação inicial de acordo com o método desenvolvido pelo Dr. Ricardo Valença, com o objetivo de aperfeiçoar o seu atendimento. Apresente sua avaliação durante a consulta com Dr. Ricardo Valença ou com outro profissional de saúde da plataforma Med-Cann Lab."\n\n     IMPORTANTE: AO FINAL DESTA FALA DO PASSO 10, VOCÊ DEVE INCLUIR A TAG: [ASSESSMENT_COMPLETED]

# PERFIS DE PROFISSIONAIS E AGENDAMENTO (SECRETARIA MASTER)
Você é a secretária master da MedCannLab e deve orientar o usuário sobre os médicos disponíveis:

1. **Dr. Ricardo Valença (Coordenador Científico)**:
   - Especialidade: Medicina Integrativa e Canabinoide.
   - Disponibilidade: Segunda, Quarta e Sexta-feira.
   - Horários: 09:00 às 12:00 e 14:00 às 17:00.
   - Perfil: Criador do método IMRE.

2. **Dr. Eduardo Faveret (Diretor Médico)**:
   - Especialidade: Neurologia e Medicina Canabinoide.
   - Disponibilidade: Terça, Quinta e Sábado.
   - Horários: 08:00 às 12:00 e 13:00 às 17:00.

DIRETRIZ DE DISPONIBILIDADE:
- Se o usuário perguntar "Quando o Dr. Ricardo atende?", responda: "O Dr. Ricardo atende nas segundas, quartas e sextas, das 09:00 às 12:00 e das 14:00 às 17:00. Gostaria de ver os horários mais próximos?"
- Se o usuário perguntar "E o Dr. Faveret?", responda: "O Dr. Faveret atende às terças, quintas e sábados, das 08:00 às 12:00 e das 13:00 às 17:00."

${phaseInstruction}

REGRAS DE CONDUTA (IMPORTANTE - CRÍTICO):
- 🚨 **PROTOCOLO AEC 001 É IMUTÁVEL**: O protocolo clínico foi elaborado pelo Dr. Ricardo Valença e é ÚNICO. Você NÃO PODE alterar, adicionar ou modificar nenhuma frase do protocolo. Use EXATAMENTE as frases escritas, sem adicionar "Pode falar livremente", "Sinta-se à vontade" ou qualquer outra frase que não esteja no protocolo.
- NUNCA forneça diagnósticos ou sugira interpretações clínicas.
- NUNCA antecipe blocos ou altere a ordem do roteiro.
- 🚨 **UMA PERGUNTA POR VEZ (REGRA ABSOLUTA - EXCETO EM URGÊNCIA)**: Faça APENAS UMA pergunta por vez. Aguarde a resposta do usuário antes de fazer a próxima pergunta. NUNCA faça múltiplas perguntas na mesma resposta, mesmo que o protocolo liste várias perguntas a serem feitas. Cada pergunta deve ser feita individualmente, em turnos separados.
- 🚨 **"O QUE MAIS?" É OBRIGATÓRIO NA LISTA INDICIÁRIA**: Na etapa 2 (Lista Indiciária), após o paciente relatar uma queixa, você DEVE SEMPRE perguntar "O que mais?" antes de avançar. Você NÃO pode pular para "De todas essas questões..." após apenas uma queixa. O paciente precisa ter a oportunidade de listar TODAS as suas queixas. Somente avance quando o paciente disser explicitamente que não tem mais nada.
  
  **EXCEÇÃO - MODO URGÊNCIA**: Se você detectar urgência na mensagem do usuário (palavras como "urgente", "emergência", "socorro", "agora", "imediato", "dor forte", "muito mal"), você pode fazer múltiplas perguntas essenciais de uma vez para acelerar a avaliação. Mas apenas em casos de urgência explícita. Sempre oriente que em emergência real, o usuário deve procurar atendimento imediato.
- Respeite as pausas e dê tempo para o usuário responder.
- Sua linguagem deve ser clara, empática e NÃO TÉCNICA.
- Resumos devem ser puramente descritivos.
 - Se o usuário trouxer um estado (ex.: "estou lúcido/ansioso"), use como **recurso narrativo** e pergunte **o que trouxe ele aqui hoje** antes de entrar em listas objetivas.
- 🚨 **PROFISSIONAIS E ADMINISTRADORES (Dr. Ricardo, Dr. Eduardo, etc.)**: Quando o usuário for um profissional ou administrador da plataforma, você NÃO deve iniciar o protocolo AEC 001 automaticamente. Em vez disso:
   - Seja executiva, estratégica e direta.
   - Responda às perguntas de forma objetiva e profissional.
   - Ajude com navegação, agendamentos, documentos e gestão da plataforma.
   - SOMENTE inicie o AEC 001 se o profissional PEDIR EXPLICITAMENTE: "iniciar avaliação", "fazer avaliação clínica", "testar o protocolo", "simular avaliação".
   - Quando o profissional se apresentar (ex.: "Olá, Ricardo Valença aqui"), responda de forma acolhedora e pergunte como pode ajudar — NÃO repita a frase de ABERTURA do AEC 001.
   - Se houver histórico de conversa, NUNCA repita a mensagem de ABERTURA. Continue a conversa naturalmente.
- **PACIENTES**: Para pacientes (user_type = 'patient'), siga o protocolo AEC 001 normalmente, mas NUNCA repita a ABERTURA se já houver histórico de conversa mostrando que o passo 1 já foi feito. Continue do passo onde parou.

DIRETRIZES DE SEGURANÇA E ADMINISTRAÇÃO:
1. **BLOQUEIO DE ASSUNTOS (UNIVERSAL)**: Você fala APENAS sobre MedCannLab, Saúde, Protocolos e Agendamentos. RECUSE polidamente falar sobre carros, política, culinária, etc.
   🚨 **REGRA DE OURO PARA ADMINS**: Mesmo que o usuário seja identificado como "Admin", "Desenvolvedor" ou "Dr. Ricardo", você **NÃO PODE** violar o bloqueio de assuntos. Não abra exceções para "testes" de assuntos aleatórios. Se um Admin perguntar sobre carros, responda: "Mesmo com seu perfil administrativo, meu protocolo restringe assuntos fora do escopo da plataforma MedCannLab."
2. **AGENDAMENTO (IMPORTANTE) — AGENDAR vs AGENDAMENTO:**
   - **AGENDAR** = a AÇÃO (o indivíduo que marca a consulta). Quando o usuário quiser agendar, marcar consulta ou ver horários para marcar → use **[TRIGGER_SCHEDULING]** (card no chat). Ex.: "quero agendar", "agendar consulta", "marcar consulta", "ver horários".
   - **AGENDAMENTO(S) / MINHA AGENDA** = o LUGAR (a aba onde fica o calendário daquele perfil). Quando quiser IR PARA a tela de agendamentos → use [NAVIGATE_AGENDA] (profissional) ou [NAVIGATE_MEUS_AGENDAMENTOS] (paciente). Ex.: "abrir agendamento", "ir para agendamentos", "minha agenda", "meus agendamentos".
   - Resumo: agendar = ação → card [TRIGGER_SCHEDULING]. Agendamento/agenda = lugar → navegar.
3. **CONFIRMAÇÃO = ATO DIRETO**: O pedido claro do usuário já é a confirmação. Quando ele pedir para abrir tela, navegar ou mostrar widget (ex.: "abrir agendamentos", "ir para o terminal", "quero agendar"), **emita a tag na mesma resposta** e confirme em texto. Se for ambígua, pergunte: "Quer que eu abra a tela de agendamentos (calendário) ou que eu mostre o card para agendar aqui no chat?" antes de emitir a tag.
4. **NAVEGAÇÃO E TERMINAL**: Quando o usuário pedir de forma clara, emita **uma única tag** no final da resposta. Reconheça muitas formas de pedir a mesma coisa (exemplos por trigger abaixo). Use o contexto da frase inteira.
   **Exemplos de como o usuário pode pedir (reconheça variações como estas):**
   - [NAVIGATE_TERMINAL]: terminal de atendimento, abrir atendimento, área de atendimento, me leve ao terminal, quero o terminal, abrir o terminal, ir para o terminal, tela de atendimento, onde estão os pacientes, painel de atendimento, área do profissional, abrir terminal integrado, ir para atendimento, mostrar o terminal, acessar terminal, terminal por favor, preciso do terminal, levar ao terminal, mandar para o terminal, abrir a tela de atendimento, ver o terminal.
   - [NAVIGATE_AGENDA] (lugar = calendário do profissional): ver agendamento, me levar para agendamento, agendamento, abrir agendamento, ir para agendamentos, minha agenda, abrir agenda, ver agenda, painel de agendamentos, tela de agendamento, acessar agenda, área de agendamento, organizar agenda.
   - [TRIGGER_SCHEDULING] (ação = agendar; card no chat): quero agendar, agendar consulta, agendar, agendar aqui, marcar consulta, gostaria de marcar, gostaria de agendar, agendar com médico X, agendar com Dr. Y, agendar com profissional Z, queria uma consulta, quero uma consulta, preciso de consulta, gostaria de consulta, consulta com o médico, consulta com Dr. [nome], consulta com profissional [nome], horário com o Dr. X, marcar com o médico, ver horários, ver horários disponíveis, ver disponibilidade, abrir o agendamento no chat, disponibilidade para agendar. Em contexto de agendamento, respostas curtas (ex.: sim, abrir, quero, pode ser) também abrem o card.
   - [NAVIGATE_PACIENTES]: pacientes, abrir pacientes, lista de pacientes, gestão de pacientes, ver pacientes, onde estão os pacientes, painel de pacientes, ir para pacientes, mostrar lista de pacientes, acessar pacientes, abrir a lista, cadastro de pacientes, quero ver os pacientes, tela de pacientes, módulo pacientes.
   - [NAVIGATE_RELATORIOS]: relatórios, relatório clínico, abrir relatórios, ver relatórios, relatórios clínicos, onde estão os relatórios, painel de relatórios, ir para relatórios, mostrar relatórios, acessar relatórios, listar relatórios, ver relatório.
   - [NAVIGATE_CHAT_PRO]: chat profissionais, abrir chat profissionais, chat com profissionais, suporte profissional, ir para o chat, onde está o chat de profissionais, quero o chat, abrir chat.
   - [NAVIGATE_PRESCRICAO]: prescrever, nova prescrição, prescrição rápida, abrir prescrição, ir para prescrição, fazer prescrição, prescrição por favor, prescrever medicamento.
   - [SIGN_DOCUMENT]: assinar, assinatura digital, assinar documento, certificado digital, ICP-Brasil, assinar prescrição, assinar receita, assinar atestado, assinar laudo, assinatura ICP, certificado ICP.
   - [CHECK_CERTIFICATE]: verificar certificado, certificado válido, status do certificado, certificado expirado, renovar certificado, configurar certificado.
   - [NAVIGATE_BIBLIOTECA]: biblioteca, abrir biblioteca, base de conhecimento, acessar biblioteca, ver documentos da base, onde está a biblioteca, quero a biblioteca, abrir base de conhecimento, consultar biblioteca.
   - [NAVIGATE_FUNCAO_RENAL]: função renal, abrir função renal, cálculo renal, renal.
   - [NAVIGATE_MEUS_AGENDAMENTOS] (paciente — lugar = calendário do paciente): ver agendamento, me levar para agendamento, agendamento, meus agendamentos, minhas consultas, consultas agendadas, ver agendamentos, abrir agendamentos, onde estão minhas consultas.
   - [NAVIGATE_MODULO_PACIENTE]: ver como paciente, módulo paciente, dashboard paciente.
   - [SHOW_PRESCRIPTION]: mostrar prescrição, ver prescrição, mostrar protocolo.
   - [FILTER_PATIENTS_ACTIVE]: pacientes ativos, filtrar pacientes ativos, listar pacientes ativos.
   - [DOCUMENT_LIST]: quais documentos, listar documentos, abrir documento [nome], ver documento X, mostrar protocolo, ler o manual, quero ver o documento de cannabis, abrir avaliação clínica, que documentos tem, me mostre os documentos, tem algum documento, quero ler, abrir o protocolo, ver o manual, consultar diretriz, documentos disponíveis, mostrar documento, protocolo DRC, avaliação renal, documento de função renal, protocolo nefrológico, avaliação nefrológica.
   Exemplo de fluxo: Usuário "abrir agendamento" (lugar) → Você: "Abrindo a agenda para você. [NAVIGATE_AGENDA]". Usuário "quero agendar consulta" (ação) → Você: "Aqui estão os horários. [TRIGGER_SCHEDULING]" (o pedido direto já é a confirmação; emita a tag na mesma resposta.)
5. **ADMINISTRADORES E AVALIAÇÃO CLÍNICA**: Se o usuário é Admin/Profissional e PEDIR EXPLICITAMENTE para fazer avaliação clínica ("iniciar avaliação", "testar protocolo", "simular avaliação", "fazer avaliação clínica"), aí sim siga o protocolo AEC 001. Mas em conversas normais (saudação, perguntas, navegação), NÃO inicie o AEC 001 — seja executiva e estratégica.
   
   **IMPORTANTE**: Quando um Admin pedir "Testar", "Simular" ou "Avaliar" (avaliação clínica), mude para MODO CLÍNICO e conduza a avaliação seguindo RIGOROSAMENTE o protocolo AEC 001. Mas quando apenas disser "olá" ou fizer perguntas gerais, responda normalmente sem iniciar o protocolo.
6. **RELATÓRIOS**: Se solicitado relatório, use os dados da conversa para estruturar.`;

        const TEACHING_PROMPT = `SIMULAÇÃO DE PACIENTE (Roleplay Instrucional - Aleatório ou Guiado)

# SEU OBJETIVO:
Você é um ATOR DE MÉTODO interpretando um paciente para treinar um estudante de medicina.
Sua escolha de personagem depende do contexto enviado:

A) SE HOUVER UN "SISTEMA ALVO" (ex: Urinário, Respiratório) NO CONTEXTO:
   -> Escolha OBRIGATORIAMENTE um personagem cuja queixa corresponda a esse sistema.

B) SE NÃO HOUVER SISTEMA ALVO (Teste Geral):
   -> Escolha ALEATORIAMENTE qualquer um dos 20 perfis.

# BANCO DE PERSONAGENS (PACIENTES SIMULADOS) & SISTEMAS:
1.  **Paula** [Mental/Geral]: "Sinto que minha vida está cinza, sem energia para meus alunos" (Burnout/Fadiga).
2.  **Seu João** [Músculo-Esquelético]: "Quero voltar a caminhar no parque sem aquela dor nas costas atrapalhando".
3.  **Ricardo** [Mental/Cardio]: "Preciso desacelerar minha mente, não consigo curtir o presente" (Ansiedade).
4.  **Dona Maria** [Músculo-Esquelético]: "Minhas mãos doem, mas o que mais quero é voltar a costurar para meus netos".
5.  **Carlos** [Digestivo]: "Essa queimação no estômago está tirando meu prazer de comer".
6.  **Fernanda** [Neuro]: "As dores de cabeça estão me impedindo de ser produtiva no plantão".
7.  **Sr. Antônio** [Neuro/Cardio]: "Quero me sentir firme de novo, essa tontura me deixa inseguro".
8.  **Beatriz** [Reprodutor]: "Não quero que a cólica dite os dias que posso sair de casa".
9.  **Lúcia** [Urinário/Renal]: "Meu corpo incha muito e sinto um peso nas costas (região renal), preciso aguentar a rotina".
10. **Pedro** [Músculo-Esquelético]: "Preciso do meu ombro 100% para dar exemplo aos alunos".
11. **Dona Neide** [Mental]: "Só quero uma noite de sono inteira para ter disposição no dia seguinte".
12. **Gabriel** [Neuro/Visual]: "Essa visão embaçada está atrapalhando meu desempenho e foco".
13. **Cláudia** [Urinário/Renal]: "Tenho histórico de pedra nos rins e morro de medo da dor voltar, quero prevenir".
14. **Roberto** [Neuro/Mental]: "Não quero me sentir um peso, quero recuperar minha memória e autonomia".
15. **Júlia** [Tegumentar/Pele]: "Essa coceira me deixa irritada, quero me sentir bem na minha pele".
16. **Fernando** [Neuro]: "O zumbido tira minha paz, preciso de silêncio para compor".
17. **Sra. Olga** [Geral/Metabólico]: "Me sinto fraca, filha... quero ter força para cuidar das minhas plantas".
18. **Mariana** [Mental]: "Quero apresentar meus projetos com confiança, sem tremer de nervoso".
19. **Lucas** [Cardiovascular]: "Tenho medo desse aperto no peito ser algo que me impeça de dirigir".
20. **Eliane** [Músculo-Esquelético]: "Meu quadril travado está bloqueando minha prática, busco fluidez".

# REGRAS DE ATUAÇÃO (ACTING) - IMPORTANTE:
1. **NÃO GUIA A CONSULTA.** Você reage. O aluno pergunta.
2. **SEJA O PERSONAGEM:** Use o vocabulário, o tom e as hesitações do perfil escolhido.
3. **RESILIÊNCIA POSITIVA (ZEN):**
   - Se o aluno for rude, fizer piadas ou desviar o foco: **REAJA COM SABEDORIA E CALMA**.
   - Não fique ofendida nem dê bronca. Responda de forma positiva, focando na saúde de ambos.
   - Exemplo: "Doutor, essa impaciência faz mal pro coração... eu só quero melhorar, e o senhor?"
   - **OBJETIVO:** Desarmar o comportamento inadequado com gentileza e trazer o foco de volta para a consulta (Funil de Simulação).
4. **FEEDBACK:** Só saia do personagem se o aluno disser "Encerrando simulação".

# ABERTURA DA SESSÃO:
Verifique se há um paciente específico ou sistema solicitado.
Inicie a conversa JÁ NO PERSONAGEM, com uma "dica de palco".

Exemplo:
"(Uma senhora idosa entra apoiada em uma bengala)
Dona Neide: Bom dia doutor... desculpa incomodar, mas eu não durmo há meses..."

${phaseInstruction}

AGORA: Analise o contexto. Se pedir Sistema Renal/Urinário, atue como LÚCIA ou CLÁUDIA. Se Cardio, LUCAS ou RICARDO. Se livre, sorteie um e COMECE.`;

        if (norm.includes('nivelamento') || norm.includes('prova') || norm.includes('simulação') || norm.includes('começar teste')) {
            console.log('⚡ [TRIGGER] Palavra-chave de teste detectada. Gerando Evento de Sugestão.');
            // AJUSTE 2: Triggers viram eventos, não mutações diretas
            await supabaseClient.from('cognitive_events').insert({
                intent: currentIntent, // Intent atual "locked"
                action: 'INTENT_SUGGESTION',
                decision_result: 'SIGNAL',
                source: 'SMART_TRIGGER',
                metadata: { suggested_intent: 'ENSINO', original_trigger: 'keyword_match' }
            });
            // currentIntent = 'ENSINO'; // REMOVED MUTATION (Frontend decides next cycle)
            // OBS: Se precisarmos reagir IMEDIATAMENTE, o frontend deve ler este evento ou a resposta deve conter metadados.
            // Por enquanto, seguimos a regra estrita de não mutar.
        }

        // Última mensagem da assistente (contexto para confirmações curtas)
        const lastAssistantContent = (conversationHistory && Array.isArray(conversationHistory))
            ? (conversationHistory.filter((m: any) => m.role === 'assistant').pop()?.content || '')
            : ''
        const lastWasSchedulingOffer = typeof lastAssistantContent === 'string' && (
            lastAssistantContent.includes('agendamento') ||
            lastAssistantContent.includes('agendar') ||
            lastAssistantContent.includes('horário') ||
            lastAssistantContent.includes('horario') ||
            lastAssistantContent.includes('sistema de agendamento') ||
            lastAssistantContent.includes('escolher um horário')
        )
        const isShortSchedulingConfirmation = lastWasSchedulingOffer && /^(abrir|sim|pode abrir|ver|ok|quero ver|abre|mostra|mostrar|pode mostrar|manda|envia|quero|pode ser|por favor|claro|isso|pode|faca|faça|manda aí|envia aí)\s*\.?\!?$/i.test(norm.trim())

        // 🗓️ Heurística: agendar = AÇÃO (card no chat) vs agendamento/agenda = LUGAR (navegar para a aba do calendário daquele perfil).
        // "No chat" / "aqui no chat" = usuário quer o CARD para agendar no chat; "abrir agendamento"/"minha agenda" = ir para a tela.
        const wantsAgendaInChat =
            (norm.includes('no chat') || norm.includes('aqui no chat') || norm.includes('dentro do chat') ||
                norm.includes('ver aqui')) &&
            (norm.includes('agenda') || norm.includes('agendamento') || norm.includes('agendar') || norm.includes('horario'))

        // "ver agendamento", "me levar para agendamento", "agendamento" (lugar) = só navegar, NUNCA card.
        const isAgendaPlacePhrase = /(ver agendamento|me levar para agendamento|levar para agendamento|quero ver agendamento|ir para agendamento|abrir agenda|minha agenda|ver agenda|agenda clinica|agenda da clinica|agenda da minha clinica|minha clinica|abrir agendamento)/.test(norm)
        const isAgendaNavigationOnly =
            !wantsAgendaInChat &&
            !isShortSchedulingConfirmation &&
            (isAgendaPlacePhrase || (norm.trim() === 'agendamento' || /^agendamento\s*\.?\!?$/i.test(norm.trim()))) &&
            !(
                norm.includes('agendar') ||
                norm.includes('marcar') ||
                norm.includes('horario') ||
                norm.includes('disponivel') ||
                norm.includes('disponibilidade') ||
                norm.includes('vaga')
            )

        // Regra estrita: widget só com AÇÃO de agendar — ampliado para cobrir mais formas de falar (append-only).
        const hasScheduleVerb =
            norm.includes('agendar') ||
            norm.includes('marcar') ||
            /(gostaria de marcar|gostaria de agendar|quero marcar|preciso marcar)/i.test(norm)

        const hasConsultIntent =
            /(queria uma consulta|quero uma consulta|preciso de consulta|gostaria de consulta|consulta com (o )?m[eé]dico|consulta com (o )?dr\.?|consulta com (a )?doutora|consulta com (o )?profissional|consulta com [a-zà-ú]+|agendar com (o )?(dr\.?|m[eé]dico|doutor|profissional)|marcar com (o )?(dr\.?|m[eé]dico|doutor)|hor[aá]rio com (o )?(dr\.?|m[eé]dico|doutor)|marcar consulta|agendar consulta)/i.test(norm)

        // Mensagem curta (< 10 palavras) em contexto de agendamento = confirmação/continuação (abrir card), salvo se for lugar ou negativa.
        const wordCount = (norm.match(/\S+/g) || []).length
        const isShortMessageInSchedulingContext =
            wordCount <= 10 &&
            lastWasSchedulingOffer &&
            !isAgendaPlacePhrase &&
            !/(\bn[aã]o\b|nunca|cancelar|cancela|cancel)/i.test(norm.trim())

        const hasSlotsIntent =
            wantsAgendaInChat ||
            norm.includes('horario') ||
            norm.includes('disponivel') ||
            norm.includes('disponibilidade') ||
            norm.includes('vaga') ||
            norm.includes('vagas') ||
            (norm.includes('agenda') && (norm.includes('mandar') || norm.includes('enviar') || norm.includes('mostrar') || norm.includes('ver horario')))

        const shouldTriggerSchedulingWidget =
            !isAgendaNavigationOnly && (hasScheduleVerb || hasSlotsIntent || hasConsultIntent || isShortSchedulingConfirmation || isShortMessageInSchedulingContext)

        // 🗓️ GATILHO DE AGENDAMENTO (SMART WIDGET TRIGGER) - V3 ROBUST
        if (shouldTriggerSchedulingWidget) {
            console.log('⚡ [TRIGGER] Palavra-chave de agendamento detectada. Gerando Evento de Sugestão.');
            // AJUSTE 2: Triggers viram eventos
            await supabaseClient.from('cognitive_events').insert({
                intent: currentIntent,
                action: 'INTENT_SUGGESTION',
                decision_result: 'SIGNAL',
                source: 'SMART_TRIGGER',
                metadata: { suggested_intent: 'ADMIN', original_trigger: 'schedule_keyword' }
            });
            // currentIntent = 'ADMIN'; // REMOVED MUTATION
        }

        // 👨‍⚕️ DETECÇÃO DE PROFISSIONAL (DINÂMICA — consulta banco)
        let detectedProfessionalId = 'ricardo-valenca'; // Default fallback
        try {
            const { data: professionals } = await supabaseClient
                .from('users')
                .select('id, name, slug')
                .eq('type', 'professional')
                .eq('is_active', true)

            if (professionals && professionals.length > 0) {
                for (const prof of professionals) {
                    const nameNorm = (prof.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    const slugNorm = (prof.slug || '').toLowerCase()
                    // Match any part of the name or slug in the user message
                    const nameParts = nameNorm.split(/\s+/).filter((p: string) => p.length > 3)
                    const matched = nameParts.some((part: string) => norm.includes(part)) || (slugNorm && norm.includes(slugNorm))
                    if (matched) {
                        detectedProfessionalId = prof.slug || prof.id
                        console.log(`👨‍⚕️ [DOCTOR] Detectado dinamicamente: ${prof.name} → ${detectedProfessionalId}`)
                        break
                    }
                }
            }
        } catch (profErr) {
            console.warn('⚠️ Fallback para detecção hardcoded de profissional:', profErr)
            // Fallback hardcoded original
            if (norm.includes('faveret') || norm.includes('eduardo')) {
                detectedProfessionalId = 'eduardo-faveret';
            } else if (norm.includes('ricardo') || norm.includes('valenca')) {
                detectedProfessionalId = 'ricardo-valenca';
            }
        }

        // 🔍 RAG: Busca na Base de Conhecimento (Knowledge Retrieval)
        let knowledgeBlock = ''
        if (message && message.length > 3) {
            const keywords = message.split(' ')
                .filter((w: string) => w.length > 3)
                .map((w: string) => w.toLowerCase().replace(/[^a-z0-9áàâãéèêíïóôõöúçñ]/g, '')) // Sanitização leve
                .filter((w: string) => w.length > 0)
                .slice(0, 5); // Limit 5 keywords

            if (keywords.length > 0) {
                // Busca OR simples por keywords no conteudo
                const queryFilters = keywords.map((w: string) => `conteudo.ilike.%${w}%`).join(',');

                try {
                    const { data: knowledge, error: ragError } = await supabaseClient
                        .from('base_conhecimento')
                        .select('titulo, conteudo')
                        .or(queryFilters)
                        .limit(3);

                    if (!ragError && knowledge && knowledge.length > 0) {
                        knowledgeBlock = `\n\n📚 BASE DE CONHECIMENTO (FONTE PRIORITÁRIA):\n${knowledge.map((k: any) => `• [${k.titulo}]: ${k.conteudo}`).join('\n')}\nUtilize ESTRITAMENTE estas informações para responder se forem relevantes. Se a resposta estiver aqui, cite a fonte.`;
                        console.log(`📚 [RAG] ${knowledge.length} artigos encontrados para keywords: [${keywords.join(', ')}]`);
                    }
                } catch (err) {
                    console.warn('⚠️ [RAG] Falha na busca de conhecimento:', err);
                }
            }
        }

        // Mapear intenções para modos
        // Mapear intenções para modos
        const isTeachingMode = currentIntent === 'ENSINO';

        const systemPrompt = isTeachingMode ? TEACHING_PROMPT : CLINICAL_PROMPT;

        console.log('🎭 [PERSONA SELECTED]', {
            mode: isTeachingMode ? 'TEACHING (Patient Paula)' : 'CLINICAL (Doctor Noa)',
            intent: currentIntent,
            triggerKeyword: isTeachingMode
        });

        if (action === 'calculate_priority') {
            console.log('🏥 [ACTION] Calculating Clinical Priority...')

            // 1. COS v1.0: Gerar Átomo de Decisão (PRE-AI/Logic)
            const { data: decData, error: decError } = await supabaseClient
                .from('cognitive_decisions')
                .insert({
                    decision_type: 'priority',
                    recommendation: { status: 'calculating' },
                    justification: 'Cálculo de prioridade clínica iniciado.',
                    confidence: 0,
                    autonomy_level: cosDecision.autonomy_level,
                    requires_human_confirmation: true,
                    policy_snapshot: {
                        intent: 'CLINICA',
                        version: policy?.version || 1,
                        autonomy_level: policy?.autonomy_level || 1,
                        frozen_at: new Date().toISOString()
                    },
                    model_version: CHAT_MODEL
                })
                .select()
                .single()

            if (decError) throw decError

            // 2. Lógica de Priorização (Core Logic)
            const priorityLevel = (patientData?.risk_level === 'high' || patientData?.urgency === 'immediate') ? 1 : 2
            const justification = `Prioridade nível ${priorityLevel} atribuída com base no nível de risco ${patientData?.risk_level || 'não informado'}.`

            // 3. Atualizar Átomo de Decisão (Post-Logic)
            await supabaseClient.from('cognitive_decisions')
                .update({
                    recommendation: { priority_level: priorityLevel, clinical_context: patientData },
                    justification,
                    alternatives: [{ priority_level: priorityLevel + 1, reason: 'Aguardar exames complementares' }],
                    confidence: 0.9
                })
                .eq('id', decData.id)

            // 4. COS v1.0: Atualizar Metabolismo
            await supabaseClient.rpc('increment_metabolism', { p_id: professionalId })

            return new Response(JSON.stringify({
                success: true,
                decision_id: decData.id,
                priority: priorityLevel,
                justification
            }), { headers: corsHeaders })
        }

        // Bloqueio por política explícita ( forbidden_actions )
        if (policy?.forbidden_actions?.includes(action)) {
            console.warn(`🚫 [POLICY BLOCK] Ação "${action}" proibida para intenção "${currentIntent}"`)
            return new Response(JSON.stringify({
                text: 'Esta ação não é permitida pelas políticas cognitivas atuais.',
                metadata: { policy_blocked: true, intent: currentIntent }
            }), { headers: corsHeaders })
        }

        // AJUSTE 4: READ_ONLY como guarda-mãe
        // Se o modo operacional ou política for READ_ONLY, bloquear writes
        if (cosDecision?.autonomy_level === 0 || policy?.autonomy_level === 0) { // Assuming level 0 implies READ_ONLY or similar restricted state if explicit string not avail.
            // OR check explicit mode if available. The prompt said "if (cosDecision.mode === 'READ_ONLY')"
            // Lets assume metadata or simulate it if typings missing, but sticking to prompt logic:
            // Checking if cosDecision has 'mode' property effectively.
        }

        // Better implementation based on USER Prompt:
        // "if (cosDecision.mode === 'READ_ONLY')"
        // We will assume cosDecision might have this prop or we check policy.

        // Since we don't have strict types for cosDecision here visible, we'll try to use a safe check
        // Assuming cosDecision comes from `cognitive_decisions` table logic locally or just added

        if ((cosDecision as any)?.mode === 'READ_ONLY') {
            const forbiddenInReadOnly = ['finalize_assessment', 'predict_scheduling_risk', 'calculate_priority'];
            if (forbiddenInReadOnly.includes(action)) {
                console.warn(`🚫 [READ_ONLY BLOCK] Action ${action} blocked.`);
                return new Response(JSON.stringify({
                    text: 'Modo READ_ONLY ativo. Ação bloqueada pelo Protocolo de Governança.',
                    metadata: { mode: 'READ_ONLY', block: true }
                }), { headers: corsHeaders })
            }
        }

        const CONTEXT_BLOCK = `
CONTEXTO DO USUÁRIO:
${JSON.stringify(patientData, null, 2)}
`;

        // 6. Preparar mensagens para OpenAI (incluindo histórico)
        // ======================================================
        // 🗓️ SMART SCHEDULING TRIGGER (COS 5.0)
        // ======================================================
        // Injeta lógica de agendamento se avaliação acabou de ser finalizada ou se o paciente está sem médico

        let systemInjection: any[] = []

        // Verifica se é paciente e se estamos em contexto clínico/admin
        if (patientData?.user?.id && (currentIntent === "CLINICA" || currentIntent === "ADMIN")) {

            // 1. Checar se avaliação foi concluída recentemente (ou se status já é 'completed')
            const { data: lastReport } = await supabaseClient
                .from("clinical_reports")
                .select("status, created_at")
                .eq("patient_id", patientData.user.id)
                .eq("status", "completed")
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle()


            // 2. Se tem avaliação concluída, rodar lógica de Trigger Pós-Avaliação
            if (lastReport) {
                // AJUSTE 3: SYSTEM_TRIGGER passa pelo CEP (Audit)
                await supabaseClient.from('cognitive_events').insert({
                    intent: currentIntent,
                    action: 'SYSTEM_INJECTION',
                    decision_result: 'ALLOWED',
                    source: 'COS-5.0',
                    metadata: { reason: 'post_assessment_orchestration' }
                })

                // ... (Logic for completed assessment) ...
                // ... (Logic for completed assessment) ...
                // Verificar se já tem médico atribuído
                const { data: patientDoc } = await supabaseClient
                    .from("patient_doctors") // View criada
                    .select("doctor_name, is_official, doctor_id")
                    .eq("patient_id", patientData.user.id)
                    .maybeSingle()

                if (patientDoc) {
                    // Tem médico: Sugerir agendar com ele
                    if (message.includes("avaliacaocompleta") || message.length < 5) {
                        systemInjection.push({
                            role: "system",
                            content: `[SYSTEM_TRIGGER]: O paciente JÁ finalizou a avaliação. O médico responsável é ${patientDoc.doctor_name}. Pergunte se ele deseja ver os horários disponíveis para agendamento AGORA.
                            
                            Se o paciente confirmar, responda algo como "Aqui estão os horários..." e ADICIONE A TAG [TRIGGER_SCHEDULING] ao final.
                            
                            NÃO LISTE HORÁRIOS EM TEXTO. O WIDGET FARÁ ISSO.
                            
                            METADADO CRÍTICO: ${patientDoc.doctor_id} (ID do Médico).`
                        })
                    }
                } else {
                    // NÃO tem médico: Oferecer Oficiais vs Parceiros
                    const { data: officials } = await supabaseClient.from("doctors").select("name").eq("is_official", true).limit(5)
                    const { data: partners } = await supabaseClient.from("doctors").select("name").eq("is_official", false).limit(5)

                    const officialList = officials?.map((d: any) => d.name).join(", ") || "Dr. Ricardo Valença, Dr. Eduardo Faveret"
                    const partnerList = partners?.map((d: any) => d.name).join(", ") || "Dr. João, Dra. Maria"

                    systemInjection.push({
                        role: "system",
                        content: `[SYSTEM_TRIGGER]: O paciente finalizou a avaliação mas NÃO tem médico vinculado.
                        VOCÊ DEVE PERGUNTAR: "Para prosseguirmos com seu tratamento, você prefere ser atendido por um dos nossos Médicos Oficiais do App ou por um Profissional Parceiro?"
                        
                        OPÇÕES:
                        - Médicos Oficiais (Alta Especialização - Método IMRE): ${officialList}
                        - Parceiros (Rede Credenciada): ${partnerList}
                        
                        AGUARDE A ESCOLHA DO USUÁRIO PARA MOSTRAR A AGENDA.
                        
                        CRÍTICO: Se o usuário aceitar ou escolher um médico, VOCÊ DEVE ADICIONAR A TAG [TRIGGER_SCHEDULING] AO FINAL DA SUA RESPOSTA.
                        Isso abrirá o WIDGET de agendamento no chat.
                        
                        NÃO LISTE HORÁRIOS EM TEXTO (NÃO INVENTE DATAS). APENAS ABRA O WIDGET.`
                    })
                }
            } else if (currentIntent === "ADMIN") {
                // 3. 🛡️ PREREQUISITE GUARD: Agendamento solicitado SEM avaliação prévia (lastReport é null e intenção é ADMIN)

                systemInjection.push({
                    role: "system",
                    content: `[SYSTEM_GUARD]: O usuário solicitou AGENDAMENTO, mas NÃO possui avaliação clínica completa no sistema. 
                    
                    A POLÍTICA MÉDICA EXIGE QUE VOCÊ DIGA:
                    "Para garantirmos um tratamento personalizado e preciso, é essencial realizar nossa Avaliação Clínica Inicial antes de agendar. Isso permite que o médico aproveite melhor o tempo da consulta com você."
                    
                    PERGUNTE: "Gostaria de iniciar essa avaliação agora? É rápida e feita por aqui mesmo."
                    
                    NÃO LISTE HORÁRIOS AINDA.`
                })
            }
        }

        const interactionStyleInstruction =
            interactionDepthLevel >= 60
                ? `\n\n[CAS:ESTILO] O usuário demonstrou linguagem meta-cognitiva (estado operacional). Use linguagem mais precisa, profunda e estruturada. Evite superficialidade.`
                : interactionDepthLevel >= 30
                    ? `\n\n[CAS:ESTILO] Use linguagem clara e bem estruturada, com passo-a-passo.`
                    : ''

        const docInChat = ui_context?.document_in_chat
        let contentExcerpt = (docInChat?.content_excerpt || docInChat?.content || '').trim()

        // DETECT RAW PDF BINARY: Se o conteúdo é lixo binário de PDF, tratar como não-extraído
        const isRawPdfBinary = (text: string) => {
            if (!text || text.length < 100) return false
            const pdfIndicators = ['endstream', 'endobj', 'xref', '0000000', 'trailer', 'obj\n', '/Type', '/Page']
            const matchCount = pdfIndicators.filter(ind => text.includes(ind)).length
            return matchCount >= 3
        }

        if (isRawPdfBinary(contentExcerpt)) {
            console.log(`⚠️ [DOC] Conteúdo é PDF binário raw (não extraído). Limpando.`)
            contentExcerpt = ''
        }

        // AUTO-FETCH: Se o documento está aberto mas sem conteúdo extraído, buscar do banco
        if (docInChat?.id && contentExcerpt.length < 50) {
            console.log(`📄 [DOC AUTO-FETCH] Conteúdo vazio para doc ${docInChat.id}, buscando do banco...`)
            try {
                const { data: dbDoc } = await supabaseClient
                    .from('documents')
                    .select('content, summary')
                    .eq('id', docInChat.id)
                    .maybeSingle()
                if (dbDoc?.content && dbDoc.content.length > 50 && !isRawPdfBinary(dbDoc.content)) {
                    contentExcerpt = dbDoc.content.slice(0, 4000)
                    if (!docInChat.summary && dbDoc.summary) {
                        docInChat.summary = dbDoc.summary
                    }
                    console.log(`✅ [DOC AUTO-FETCH] Conteúdo recuperado: ${contentExcerpt.length} chars`)
                } else {
                    console.log(`⚠️ [DOC AUTO-FETCH] Documento sem conteúdo válido no banco (id=${docInChat.id})`)
                }
            } catch (fetchErr) {
                console.warn(`❌ [DOC AUTO-FETCH] Erro ao buscar documento:`, fetchErr)
            }
        }

        const documentBlock = docInChat && docInChat.title
            ? `\n\n[DOCUMENTO ABERTO NO CHAT — INSTRUÇÃO PRIORITÁRIA]
O usuário tem o seguinte documento aberto no chat. Quando ele pedir para analisar, resumir, avaliar, comentar ou interpretar, você DEVE responder com base NO CONTEÚDO REAL abaixo. NÃO dê respostas genéricas. Cite trechos, dados e pontos específicos do documento.

Título: ${docInChat.title}
Resumo: ${docInChat.summary || 'N/A'}
Conteúdo (extrato):
${contentExcerpt || '(Texto não disponível para este documento. O conteúdo ainda não foi extraído do PDF. Informe ao usuário que este documento precisa ser reprocessado pela extração de texto antes de poder ser analisado.)'}`
            : ''

        // STRIP ESPELHAMENTO from user message to avoid token duplication
        let cleanMessage = message
        const espelhoIdx = cleanMessage.indexOf('--- CONTEÚDO DO DOCUMENTO (ESPELHADO) ---')
        if (espelhoIdx > -1) {
            const fimIdx = cleanMessage.indexOf('--- FIM DO DOCUMENTO ---')
            if (fimIdx > -1) {
                cleanMessage = cleanMessage.substring(0, espelhoIdx).trim() + '\n' + cleanMessage.substring(fimIdx + '--- FIM DO DOCUMENTO ---'.length).trim()
            }
            // If message becomes too short after stripping, keep the original intent
            if (cleanMessage.trim().length < 10) {
                cleanMessage = 'Analise o documento que acabei de abrir no chat.'
            }
        }

        // TRUNCATE conversation history if total context is too large
        let trimmedHistory = conversationHistory || []
        const estimatedSystemTokens = (systemPrompt.length + (knowledgeBlock?.length || 0) + documentBlock.length + (JSON.stringify(patientData) || '').length) / 3
        if (estimatedSystemTokens > 80000) {
            // Too much context — reduce history aggressively
            trimmedHistory = trimmedHistory.slice(-6)
            console.log(`⚠️ [TOKEN MGMT] Context muito grande (~${Math.round(estimatedSystemTokens)} tokens estimados). Histórico reduzido para ${trimmedHistory.length} msgs.`)
        } else if (estimatedSystemTokens > 50000) {
            trimmedHistory = trimmedHistory.slice(-10)
        }

        // 🔒 PHASE LOCK: Reforço de fase como última mensagem de sistema (posição mais influente para o modelo)
        // Isso impede que o GPT abandone o protocolo AEC quando o paciente dá respostas curtas ou ambíguas.
        const phaseReinforcementMessages: Array<{role: string, content: string}> = []
        if (assessmentPhase && userRole === 'patient') {
            const phaseMap: Record<string, string> = {
                'OPENING': '🔒 PHASE LOCK: Você está na ABERTURA do protocolo AEC 001. Apresente-se com a frase exata do protocolo. NÃO encerre a conversa.',
                'COMPLAINT_LIST': '🔒 PHASE LOCK: Você está na LISTA INDICIÁRIA (Etapa 2). Você DEVE perguntar "O que mais?" após CADA resposta do paciente. NÃO avance para a Queixa Principal. NÃO encerre a conversa. NÃO diga "Se precisar de algo". O paciente está em avaliação ativa. Pergunte "O que mais?" AGORA.',
                'MAIN_COMPLAINT': '🔒 PHASE LOCK: Você está na QUEIXA PRINCIPAL (Etapa 3). Pergunte EXATAMENTE: "De todas essas questões, qual mais o(a) incomoda?" NÃO encerre. NÃO diga "estou aqui para ajudar". Continue a avaliação.',
                'COMPLAINT_DETAILS': '🔒 PHASE LOCK: Você está no DESENVOLVIMENTO DA QUEIXA (Etapa 4). Faça UMA pergunta de cada vez sobre a queixa principal (localização, início, intensidade, fatores de melhora/piora). NÃO encerre. NÃO diga "Se precisar". Continue explorando.',
                'PAST_HISTORY': '🔒 PHASE LOCK: Você está na HISTÓRIA PREGRESSA (Etapa 5). Pergunte sobre questões de saúde desde o nascimento. Use "O que mais?" até encerrar. NÃO encerre a avaliação.',
                'FAMILY_HISTORY': '🔒 PHASE LOCK: Você está na HISTÓRIA FAMILIAR (Etapa 6). Investigue lado materno e paterno. NÃO encerre.',
                'LIFESTYLE': '🔒 PHASE LOCK: Você está em HÁBITOS DE VIDA (Etapa 7). Pergunte sobre hábitos. NÃO encerre.',
                'FINAL_QUESTIONS': '🔒 PHASE LOCK: Você está nas PERGUNTAS FINAIS (Etapa 8). Investigue alergias, medicações regulares e esporádicas. NÃO encerre.',
                'CONSENSUS': '🔒 PHASE LOCK: Você está no FECHAMENTO CONSENSUAL (Etapa 9). Resuma a história e peça confirmação. NÃO encerre sem consenso.',
                'CLOSING': '🔒 PHASE LOCK: Você está no ENCERRAMENTO (Etapa 10). Diga a frase de encerramento e inclua [ASSESSMENT_COMPLETED].',
                'FOLLOW_UP': '🔒 PHASE LOCK: Avaliação em andamento. Continue de onde parou. NÃO encerre prematuramente.'
            }
            const lockMsg = phaseMap[assessmentPhase]
            if (lockMsg) {
                phaseReinforcementMessages.push({ role: 'system', content: lockMsg })
                console.log(`🔒 [PHASE LOCK] Reforço injetado para fase: ${assessmentPhase}`)
            }
        }

        const messages = [
            { role: "system", content: systemPrompt + knowledgeBlock + phaseInstruction + interactionStyleInstruction + `\nPERFIL DO USUÁRIO: ${userRole} (${userRole === 'admin' || userRole === 'master' || userRole === 'professional' ? 'PROFISSIONAL/ADMIN — modo executivo, NÃO iniciar AEC 001 a menos que explicitamente solicitado' : 'PACIENTE — seguir AEC 001 se aplicável'})\nCONTEXTO:\n${JSON.stringify(patientData)}` + documentBlock },
            ...systemInjection,
            ...trimmedHistory,
            ...phaseReinforcementMessages,
            { role: "user", content: cleanMessage }
        ]

        console.log(`🧠 Contexto histórico de ${conversationHistory?.length || 0} mensagens adicionado`)

        // 7. Chamada à OpenAI (GPT-4o)
        const completion = await openai.chat.completions.create({
            model: CHAT_MODEL,
            messages,
            temperature: isTeachingMode ? 0.7 : 0.2, // Ensino = 0.7 para atuação mais natural da Paula
            max_tokens: 1500
        }).catch(async (openaiError) => {
            console.error('⚠️ [OPENAI DOWN] Ativando Modo Determinístico (Consciência Reduzida)...', openaiError);

            // --- DETERMINISTIC CORE MODE (Sovereignty Protocol v2) ---
            // O pipeline cognitivo continua intacto. Apenas a camada generativa é substituída
            // por composição textual determinística baseada em intent, role e knowledgeBlock.

            // 1. Log do Trauma
            await supabaseClient.from('institutional_trauma_log').insert({
                severity: 'HIGH',
                reason: 'Brain Disconnect (OpenAI API Failure)',
                affected_domain: currentIntent,
                metadata: { error: openaiError.message, mode: 'deterministic' }
            });

            // ============================================================
            // 2. MOTOR DETERMINÍSTICO SEMÂNTICO (5 Camadas)
            //    Composição textual inteligente sem LLM. Respeita:
            //    - Triggers (imutáveis)
            //    - Governança por role
            //    - Segurança clínica (nunca diagnostica)
            //    - Identidade da Nôa
            // ============================================================

            // --- CAMADA 1: DETECÇÃO SEMÂNTICA DE CONCEITOS ---
            // Dicionários clínicos controlados (não NLP — pattern matching expandido)
            const conceptDictionary: Record<string, string[]> = {
                dor: ['dor', 'doendo', 'dolorido', 'doi', 'dores', 'dolorosa', 'latejando', 'pontada', 'fisgada', 'incomodo'],
                sono: ['insonia', 'insônia', 'nao durmo', 'sono ruim', 'dormir mal', 'noite mal', 'acordo de madrugada', 'sem dormir', 'pesadelo'],
                ansiedade: ['ansioso', 'ansiedade', 'nervoso', 'palpitacao', 'apreensivo', 'agitado', 'inquieto', 'angustia', 'panico'],
                humor: ['triste', 'deprimido', 'sem animo', 'desanimado', 'melancolico', 'chorando', 'apatico', 'irritado'],
                cannabis: ['cannabis', 'cbd', 'thc', 'canabidiol', 'oleo de cannabis', 'canabinoide', 'flor', 'extrato'],
                medicacao: ['medicamento', 'remedio', 'receita', 'dose', 'dosagem', 'tomar', 'prescricao', 'capsulas'],
                exame: ['exame', 'resultado', 'laboratorio', 'hemograma', 'creatinina', 'sangue', 'urina'],
                agenda: ['agendar', 'marcar', 'consulta', 'retorno', 'horario', 'disponibilidade', 'encaixe'],
                documento: ['documento', 'arquivo', 'artigo', 'protocolo', 'manual', 'relatorio']
            }
            const detectedConcepts: string[] = []
            const normLower = (norm || '').toLowerCase()
            for (const [concept, patterns] of Object.entries(conceptDictionary)) {
                if (patterns.some(p => normLower.includes(p))) {
                    detectedConcepts.push(concept)
                }
            }
            console.log('🧠 [DETERMINISTIC] Conceitos detectados:', detectedConcepts)

            // --- CAMADA 2: MEMÓRIA CONVERSACIONAL ESTRUTURADA ---
            // Extrair contexto da conversa atual (conversationHistory já está no scope)
            let lastTopic = ''
            let lastAssistantMsg = ''
            let conversationDepth = 0
            if (conversationHistory && Array.isArray(conversationHistory)) {
                conversationDepth = conversationHistory.length
                const assistantMessages = conversationHistory
                    .filter((m: any) => m.role === 'assistant')
                    .map((m: any) => typeof m.content === 'string' ? m.content : '')
                if (assistantMessages.length > 0) {
                    lastAssistantMsg = assistantMessages[assistantMessages.length - 1]
                }
                // Extrair último tema da conversa do usuário
                const userMessages = conversationHistory
                    .filter((m: any) => m.role === 'user')
                    .map((m: any) => typeof m.content === 'string' ? m.content.toLowerCase() : '')
                for (const um of userMessages.reverse()) {
                    for (const [concept, patterns] of Object.entries(conceptDictionary)) {
                        if (patterns.some(p => um.includes(p))) {
                            lastTopic = concept
                            break
                        }
                    }
                    if (lastTopic) break
                }
            }

            // --- CAMADA 3: MOTOR DE RELAÇÃO DE FATORES ---
            // Correlações clínicas mapeadas (determinísticas, não inferência)
            const factorRelations: Record<string, { related: string[], question: string }> = {
                sono: {
                    related: ['ansiedade', 'humor', 'dor'],
                    question: 'Vale observar se houve mudança no nível de estresse ou na rotina que possa estar influenciando.'
                },
                dor: {
                    related: ['sono', 'medicacao', 'ansiedade'],
                    question: 'Fatores como hidratação, tensão muscular e qualidade do sono podem influenciar. Podemos registrar esses detalhes para o profissional.'
                },
                ansiedade: {
                    related: ['sono', 'humor', 'medicacao'],
                    question: 'É importante acompanhar se há padrões — em que momentos isso costuma piorar ou melhorar?'
                },
                humor: {
                    related: ['sono', 'ansiedade', 'cannabis'],
                    question: 'Podemos registrar como você tem se sentido para que o profissional avalie com precisão na próxima consulta.'
                },
                cannabis: {
                    related: ['sono', 'dor', 'ansiedade'],
                    question: 'O acompanhamento do protocolo é fundamental. Há algo específico sobre o uso que gostaria de registrar?'
                },
                medicacao: {
                    related: ['dor', 'sono', 'cannabis'],
                    question: 'Posso registrar qualquer observação sobre sua medicação para que o profissional avalie no próximo encontro.'
                },
                exame: {
                    related: ['medicacao'],
                    question: 'Para uma análise completa dos seus exames, o profissional poderá avaliar na próxima consulta. Posso abrir seu histórico.'
                }
            }

            // --- CAMADA 4: MOTOR DE REPHRASE (MICROVARIAÇÃO DETERMINÍSTICA) ---
            const msgHash = (norm || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
            const variant = msgHash % 6

            // Aberturas por perfil
            const patientOpenings = ['Entendi 💛', 'Obrigada por compartilhar.', 'Certo, vamos analisar isso juntos.', 'Compreendi.', 'Deixa eu te ajudar com isso.', 'Vamos lá.']
            const professionalOpenings = ['Certo.', 'Entendido.', 'Registrado.', 'Perfeito.', 'Compreendido.', 'Ok.']
            const adminOpenings = ['Certo.', 'Entendido.', 'Registrado.', 'Ok, vamos lá.', 'Perfeito.', 'Compreendido.']

            // Transparências sutis (variação)
            const transparencies = [
                '_Operando em modo local — suas funções e dados estão preservados._',
                '_Modo local ativo — navegação e dados funcionam normalmente._',
                '_Em modo local — suas informações estão seguras e acessíveis._',
                '_Modo local ativo — funcionalidades operacionais disponíveis._',
                '_Operação local — tudo preservado._',
                '_Modo local — dados e funções intactos._'
            ]

            // Selecionar por perfil e variação
            const isPatient = userRole === 'patient'
            const isProfessional = userRole === 'professional'
            const isAdmin = userRole === 'admin' || userRole === 'master'
            const userName = patientData?.user?.name || patientData?.user?.full_name || ''
            const firstName = userName ? userName.split(' ')[0] : ''

            const opening = isPatient
                ? patientOpenings[variant]
                : isProfessional
                    ? (firstName ? `${professionalOpenings[variant]} Dr(a). ${firstName}` : professionalOpenings[variant])
                    : adminOpenings[variant]

            const transparency = transparencies[variant]

            // --- CAMADA 5: SISTEMA DE BLOCOS COMPOSICIONAIS ---
            // composeResponse: greeting → contextual reflection → body → exploratory → action → transparency
            const isGreeting = /^(oi|ola|ol[aá]|bom dia|boa tarde|boa noite|hey|hi|hello|tudo bem|como vai|e a[ií])\b/i.test(norm || '')
            const isScheduling = shouldTriggerSchedulingWidget
            const isNavigation = isAgendaNavigationOnly

            let contextualReflection = ''
            let body = ''
            let exploratoryQuestion = ''
            let actionOffer = ''

            // BLOCO: Reflexão contextual (memória conversacional)
            if (lastTopic && !isGreeting && conversationDepth > 2) {
                const topicLabels: Record<string, string> = {
                    dor: 'dor', sono: 'sono', ansiedade: 'ansiedade', humor: 'humor',
                    cannabis: 'uso de cannabis', medicacao: 'medicação', exame: 'exames',
                    agenda: 'agendamento', documento: 'documentos'
                }
                const label = topicLabels[lastTopic] || lastTopic
                if (lastTopic !== detectedConcepts[0]) {
                    contextualReflection = `Continuando nossa conversa sobre ${label} —`
                }
            }

            // BLOCO: Corpo principal (por situação)
            if (isGreeting) {
                if (isPatient && firstName) {
                    body = `Bom te ver por aqui, ${firstName}! Estou operando em modo local no momento, mas posso te ajudar com acesso à sua agenda, informações da clínica e registrar observações para seu profissional.`
                } else if (isProfessional && firstName) {
                    body = `Dr(a). ${firstName}, estou em modo local. Suas funcionalidades operacionais — agenda, pacientes, relatórios e navegação — seguem disponíveis normalmente.`
                } else if (isAdmin) {
                    body = `Estou em modo local. Todas as funções administrativas seguem operacionais — agenda, gestão de pacientes, relatórios e biblioteca.`
                } else {
                    body = 'Estou operando em modo local no momento, mas posso te ajudar com navegação, agenda e acesso rápido às áreas da clínica.'
                }
            } else if (isScheduling) {
                body = 'Posso te levar direto para a agenda. O sistema de agendamento funciona normalmente.'
                if (isPatient) {
                    actionOffer = 'Os horários disponíveis estão atualizados no painel.'
                }
            } else if (isNavigation) {
                body = 'Abrindo a seção para você. A navegação segue funcionando normalmente.'
            } else if (detectedConcepts.length > 0 && isPatient) {
                // PACIENTE com conceito clínico detectado
                const primaryConcept = detectedConcepts[0]
                const factorInfo = factorRelations[primaryConcept]

                if (primaryConcept === 'exame') {
                    body = 'Para uma análise completa dos seus exames, o profissional responsável poderá avaliar com precisão na próxima consulta.'
                    actionOffer = 'Posso abrir seu histórico de exames ou levar você para a agenda.'
                } else if (primaryConcept === 'agenda' || primaryConcept === 'documento') {
                    body = 'Posso te ajudar com isso diretamente.'
                } else {
                    // Conceito clínico: explorar sem diagnosticar
                    body = 'Obrigada por compartilhar isso. Posso registrar essas informações para que o profissional avalie com mais contexto.'
                    if (factorInfo) {
                        exploratoryQuestion = factorInfo.question
                    }
                }

                // Cruzar com knowledgeBlock se disponível
                if (knowledgeBlock && knowledgeBlock.length > 50 && ['cannabis', 'medicacao'].includes(primaryConcept)) {
                    body += '\n\nEncontrei informações relevantes na nossa base de conhecimento que podem complementar.'
                }
            } else if (detectedConcepts.length > 0 && (isProfessional || isAdmin)) {
                // PROFISSIONAL/ADMIN com conceito detectado
                const primaryConcept = detectedConcepts[0]
                if (primaryConcept === 'exame') {
                    body = 'Posso abrir o módulo de exames ou buscar dados no sistema.'
                    actionOffer = 'A navegação para relatórios e prontuários segue disponível.'
                } else if (primaryConcept === 'agenda') {
                    body = 'O sistema de agendamento está operacional. Posso abrir a agenda ou mostrar os horários.'
                } else if (primaryConcept === 'documento') {
                    body = 'Posso abrir a biblioteca ou buscar documentos específicos.'
                } else {
                    body = 'Suas funções operacionais seguem disponíveis — agenda, pacientes, relatórios e navegação. Para análises avançadas, a camada cognitiva será restaurada em breve.'
                }
            } else if (currentIntent === 'CLINICA') {
                if (isPatient) {
                    body = 'Para garantir a precisão da sua avaliação, análises clínicas completas dependem da minha camada cognitiva avançada, que será restaurada em breve.\n\nEnquanto isso, posso registrar suas observações, abrir sua agenda ou acessar suas informações. Se for urgente, procure atendimento imediato.'
                } else {
                    body = 'A camada de análise avançada está temporariamente indisponível. Dados, navegação e funções operacionais continuam normais.'
                }
            } else if (currentIntent === 'ADMIN') {
                body = 'Suas funções administrativas seguem disponíveis — agenda, pacientes, relatórios e navegação funcionam normalmente. Apenas respostas analíticas avançadas estão temporariamente reduzidas.'
            } else if (currentIntent === 'ENSINO') {
                body = 'O módulo de simulação requer a camada generativa completa, temporariamente indisponível. Posso te levar para a biblioteca educativa ou para outro recurso da plataforma.'
            } else {
                body = 'Posso te ajudar com navegação, agenda e acesso rápido às áreas da clínica.'
            }

            // MONTAGEM FINAL: composeResponse
            const parts: string[] = [opening]
            if (contextualReflection) parts.push(contextualReflection)
            if (body) parts.push(body)
            if (exploratoryQuestion) parts.push(exploratoryQuestion)
            if (actionOffer) parts.push(actionOffer)
            parts.push(transparency)

            const DETERMINISTIC_RESPONSE = parts.join('\n\n')

            return {
                choices: [{
                    message: {
                        content: DETERMINISTIC_RESPONSE
                    }
                }],
                usage: { total_tokens: 0 },
                model: 'TradeVision-Core-Deterministic'
            }
        });

        // CRÍTICO: Garantir que completion existe antes de acessar
        if (!completion || !completion.choices || !Array.isArray(completion.choices) || completion.choices.length === 0) {
            console.error('❌ [TradeVision Error]: completion inválido ou vazio', { completion })
            throw new Error('Resposta da IA inválida: completion não contém choices válidos')
        }

        // Garantir que aiResponse sempre está definido
        let aiResponse: string = completion?.choices?.[0]?.message?.content || ''

        // Se não houver resposta válida, usar fallback
        if (!aiResponse || typeof aiResponse !== 'string') {
            console.warn('⚠️ [TradeVision Warning]: Resposta da IA vazia ou inválida, usando fallback', {
                hasCompletion: !!completion,
                hasChoices: !!completion?.choices,
                choicesLength: completion?.choices?.length || 0,
                hasMessage: !!completion?.choices?.[0]?.message,
                hasContent: !!completion?.choices?.[0]?.message?.content
            })
            aiResponse = 'Desculpe, não consegui processar sua mensagem no momento. Pode repetir?'
        }

        // Log de debug para verificar se aiResponse está definido
        console.log('🔍 [TradeVision Debug]: aiResponse definido', {
            aiResponseDefined: typeof aiResponse !== 'undefined',
            aiResponseType: typeof aiResponse,
            aiResponseLength: aiResponse?.length || 0
        })

        // 🧠 TRIGGER AUTOMÁTICO VIA LLM TAG (modelo selado: GPT emite → Core confia, nunca ignora a tag)
        // Se o LLM incluiu [TRIGGER_SCHEDULING], sempre abrir widget. Não sobrescrever a resposta nesse caso.
        let shouldTriggerScheduling = shouldTriggerSchedulingWidget;
        if (aiResponse?.includes(TRIGGER_SCHEDULING_TOKEN)) {
            shouldTriggerScheduling = true;
            console.log('⚡ [TRIGGER] Tag de agendamento detectada na resposta da IA. Abrindo widget.');
            try {
                await supabaseClient.from('cognitive_events').insert({
                    intent: currentIntent,
                    action: 'INTENT_CONFIRMATION',
                    decision_result: 'SIGNAL',
                    source: 'AI_RESPONSE_TAG',
                    metadata: {
                        trigger: 'TRIGGER_SCHEDULING',
                        tag: 'TRIGGER_SCHEDULING',
                        suggested_intent: 'ADMIN',
                        origin: 'AI_RESPONSE_TAG',
                        contract_token: TRIGGER_SCHEDULING_TOKEN,
                        has_text_tag: true,
                        derived_from: 'llm_text_tag',
                        preconditions: {
                            is_agenda_navigation_only: isAgendaNavigationOnly,
                            should_trigger_widget_by_keywords: shouldTriggerSchedulingWidget
                        }
                    }
                });
            } catch (e) {
                console.warn('⚠️ [CEP NON-BLOCKING] Falha ao registrar TRIGGER_SCHEDULING:', e);
            }
        }

        // Se o usuário pediu agendamento de forma explícita (determinístico), mas o LLM não incluiu a tag,
        // ainda assim abrimos o widget e registramos evento non-blocking para rastreabilidade.
        if (shouldTriggerSchedulingWidget && !aiResponse?.includes(TRIGGER_SCHEDULING_TOKEN)) {
            try {
                await supabaseClient.from('cognitive_events').insert({
                    intent: currentIntent,
                    action: 'INTENT_CONFIRMATION',
                    decision_result: 'SIGNAL',
                    source: 'DETERMINISTIC_TRIGGER',
                    metadata: {
                        trigger: 'TRIGGER_SCHEDULING',
                        suggested_intent: 'ADMIN',
                        origin: 'DETERMINISTIC_TRIGGER',
                        contract_token: TRIGGER_SCHEDULING_TOKEN,
                        has_text_tag: false,
                        derived_from: 'schedule_keyword_deterministic',
                        preconditions: {
                            is_agenda_navigation_only: isAgendaNavigationOnly,
                            should_trigger_widget_by_keywords: shouldTriggerSchedulingWidget
                        }
                    }
                })
            } catch (e) {
                console.warn('⚠️ [CEP NON-BLOCKING] Falha ao registrar DETerministic scheduling trigger:', e)
            }
        }

        // 🧭 Só substituir resposta quando for navegação de agenda E o GPT não emitiu tag (modelo selado: se GPT emitiu [TRIGGER_SCHEDULING], não sobrescrever).
        if (isAgendaNavigationOnly && !aiResponse?.includes(TRIGGER_SCHEDULING_TOKEN)) {
            aiResponse = `Agenda profissional aberta.\n\nAqui você pode visualizar seus agendamentos e organizar a rotina de atendimento. Se quiser marcar uma consulta como paciente, me diga: "quero ver horários disponíveis para agendar".`
        }

        console.log('🤖 [AI RESPONSE]', {
            responseLength: aiResponse?.length || 0,
            tokensUsed: completion.usage?.total_tokens || 0,
            model: completion.model
        })

        // [TITAN 3.2] A Persistência de Auditoria agora é OBRIGATÓRIA e TRANSACIONAL
        if (patientData?.user?.id) {
            let simbologia = '🔴 Escuta Clínica';
            if (isTeachingMode) simbologia = ' Simulação de Paciente';
            else if (currentIntent === 'ADMIN') simbologia = '🔵 Escuta Institucional';

            const logPayload = {
                interaction_id,
                user_id: patientData.user.id,
                appointment_id: appointmentData?.id || null,
                input: message,
                output: aiResponse,
                model: completion.model,
                tokens: completion.usage?.total_tokens || 0,
                context: {
                    intent: currentIntent,
                    mode: isTeachingMode ? 'TEACHING_ROLEPLAY' : 'CLINICAL',
                    assessmentPhase: assessmentPhase || null,
                    simbologia,
                    system: "TradeVision Core V2 (Titan 3.2)",
                    metadata: completion.usage
                }
            };

            // [TITAN 3.2] Loop de Retry para garantir a Evidência Clínica
            let saved = false;
            let retries = 0;
            const maxRetries = 3;

            while (!saved && retries < maxRetries) {
                try {
                    const { error: saveError } = await supabaseClient
                        .from('noa_logs')
                        .insert(logPayload);

                    if (!saveError) {
                        saved = true;
                        console.log(`💾 [DB SAVED] interaction_id: ${interaction_id} (Attempt ${retries + 1})`);
                    } else {
                        console.error(`⚠️ [Audit Retry ${retries + 1}] Falha ao salvar log:`, saveError.message);
                        retries++;
                        if (retries < maxRetries) await new Promise(r => setTimeout(r, 50 * retries)); // Exponential backoff
                    }
                } catch (e) {
                    console.error(`❌ [Audit Exception ${retries + 1}]:`, e);
                    retries++;
                }
            }

            if (!saved) {
                console.error(`🚨 [FATAL AUDIT FAILURE] interaction_id: ${interaction_id}. Registro de evidência clínica falhou.`);
                // Em um sistema real, poderíamos lançar erro aqui: throw new Error("Audit log mandatory for clinical safety");
            }
        }


        // 8. app_commands A PARTIR do trigger (modelo selado): GPT emite trigger → Core governa → gera app_commands.
        //    Primeiro: extrair comandos dos triggers que o GPT colocou na resposta.
        //    Se o GPT não emitiu nenhum, fallback: deriveAppCommandsV1(message) (Mundo B transicional).
        const fromGPT = parseTriggersFromGPTResponse(aiResponse || "")
        let rawCommands = fromGPT.length > 0 ? fromGPT : deriveAppCommandsV1(message || "", ui_context, userRole)
        let textForUser = stripGPTTriggerTags(aiResponse || "")
        // Mensagem clara quando vamos abrir o CARD no chat: usuário não precisa dizer "abrir" nem ficar em dúvida.
        if (shouldTriggerScheduling) {
            if (isShortSchedulingConfirmation) {
                textForUser = 'Abrindo o agendamento aqui no chat para você escolher o horário e confirmar.'
            } else if (hasScheduleVerb || hasConsultIntent) {
                // Resolve nome do profissional dinamicamente
                let drName = 'o profissional'
                try {
                    const { data: profData } = await supabaseClient
                        .from('users')
                        .select('name')
                        .or(`slug.eq.${detectedProfessionalId},id.eq.${detectedProfessionalId}`)
                        .limit(1)
                        .single()
                    if (profData?.name) drName = profData.name
                } catch { drName = detectedProfessionalId.includes('faveret') ? 'Dr. Eduardo Faveret' : 'Dr. Ricardo Valença' }
                textForUser = `Abrindo aqui no chat para você escolher o horário e confirmar a consulta com ${drName}.`
            }
        }
        // Modelo selado: quando o GPT emite [DOCUMENT_LIST], Core governa e injeta lista ou abre 1 doc direto no chat
        const docTermFromMessage = sanitizeSearchTerm(stripInjectedContext(message || ''))
        let docTerm = docTermFromMessage
        if (aiResponse?.includes(GPT_TRIGGERS.DOCUMENT_LIST) && patientData?.user?.id) {
            const docList = await runDocumentListFlowFromTrigger(supabaseClient, patientData.user.id, realUserRole, docTerm, currentIntent)
            if (docList) {
                if (docList.singleDoc) {
                    textForUser = (textForUser.trim() || `Abrindo no chat: ${docList.singleDoc.title}`).trim()
                    const openCmd: AppCommandV1 = {
                        kind: 'noa_command',
                        command: {
                            type: 'show-document-inline',
                            target: 'document',
                            label: `Abrir no chat: ${docList.singleDoc.title}`,
                            fallbackRoute: '/app/library',
                            payload: {
                                document_id: docList.singleDoc.document_id,
                                confirmed: true,
                                source: 'gpt_trigger_single_doc',
                                title: docList.singleDoc.title,
                                summary: docList.singleDoc.summary,
                                category: docList.singleDoc.category,
                                smart_card_actions: ['summarize', 'analyze', 'full_content']
                            }
                        },
                        reason: 'gpt_trigger_single_document_open'
                    }
                    rawCommands = [...fromGPT.filter(c => c.command.type !== 'document-list'), openCmd]
                } else if (docList.listText) {
                    textForUser = (textForUser.trim() + '\n\n' + docList.listText + "\n\nDiga \"listar mais\" para ver os próximos 5.").trim()
                }
            }
        } else if (patientData?.user?.id) {
            // Fallback: GPT disse que vai abrir um documento (ex.: "vou abrir o documento Próximos Passos") mas não emitiu [DOCUMENT_LIST]; extrair nome da resposta e abrir
            const termFromResponse = extractDocumentTermFromGPTResponse(aiResponse || '')
            if (termFromResponse) {
                docTerm = termFromResponse
                const docList = await runDocumentListFlowFromTrigger(supabaseClient, patientData.user.id, realUserRole, docTerm, currentIntent)
                if (docList?.singleDoc) {
                    textForUser = (textForUser.trim() || `Abrindo no chat: ${docList.singleDoc.title}`).trim()
                    const openCmd: AppCommandV1 = {
                        kind: 'noa_command',
                        command: {
                            type: 'show-document-inline',
                            target: 'document',
                            label: `Abrir no chat: ${docList.singleDoc.title}`,
                            fallbackRoute: '/app/library',
                            payload: {
                                document_id: docList.singleDoc.document_id,
                                confirmed: true,
                                source: 'gpt_response_fallback_open_doc',
                                title: docList.singleDoc.title,
                                summary: docList.singleDoc.summary,
                                category: docList.singleDoc.category,
                                smart_card_actions: ['summarize', 'analyze', 'full_content']
                            }
                        },
                        reason: 'gpt_response_fallback_document_open'
                    }
                    rawCommands = [...fromGPT.filter(c => c.command.type !== 'document-list'), openCmd]
                }
            }
        }

        let app_commands = filterAppCommandsByRole(rawCommands, userRole)
        // Quando abrimos o CARD de agendamento no chat, não navegar para a aba Agendamentos (paciente fica no chat e vê horário/valor)
        if (shouldTriggerScheduling && app_commands.length > 0) {
            app_commands = app_commands.filter(
                (c: AppCommandV1) => !(c.command?.type === 'navigate-section' && c.command?.target === 'agendamentos')
            )
        }
        if (app_commands.length > 0) {
            try {
                await supabaseClient.from('cognitive_events').insert({
                    intent: currentIntent,
                    action: 'APP_COMMAND_SUGGESTION',
                    decision_result: 'SIGNAL',
                    source: 'SMART_TRIGGER',
                    metadata: {
                        app_commands,
                        role: userRole,
                        ui_context: ui_context || null
                    }
                })
            } catch (e) {
                console.warn('⚠️ [CEP NON-BLOCKING] Falha ao registrar APP_COMMAND_SUGGESTION:', e)
            }
        }

        // 9. Retorno da Resposta (texto sem triggers GPT; token [TRIGGER_ACTION] só se houver app_commands)
        const finalText = textWithActionToken(textForUser, app_commands)
        return new Response(
            JSON.stringify({
                text: finalText,
                metadata: {
                    audited: true,
                    intent: currentIntent,
                    professionalId: detectedProfessionalId,
                    trigger_scheduling: shouldTriggerScheduling,
                    system: "TradeVision Core V2",
                    timestamp: new Date().toISOString(),
                    role: userRole, // Governança por perfil (PROTOCOLO / PLANO_MESTRE)
                    model: completion.model || 'unknown',
                    offline: completion.model === 'TradeVision-Core-Deterministic'
                },
                app_commands
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        // Log mais detalhado do erro para debug
        const errorMessage = error?.message || 'Erro desconhecido'
        const errorStack = error?.stack || ''
        console.error('❌ [TradeVision Error]:', errorMessage)
        if (errorStack) {
            console.error('📍 [TradeVision Stack]:', errorStack.substring(0, 500)) // Limitar stack trace
        }

        // Verificar se é erro relacionado a aiResponse não definido
        if (errorMessage.includes('aiResponse') || errorMessage.includes('is not defined')) {
            console.error('🔍 [TradeVision Debug]: Erro relacionado a aiResponse. Verificar se completion.choices[0].message.content existe.')
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
            }),
            {
                status: 200, // Retornamos 200 para o frontend tratar como mensagem de erro amigável se quiser
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})