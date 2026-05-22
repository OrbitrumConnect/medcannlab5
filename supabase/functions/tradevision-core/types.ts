// ============================================================================
// types.ts — Tipos compartilhados do tradevision-core (comandos de app/UI).
// Extraído do index.ts no refator V1.9.419 (anti-bus-factor). Tipos puros —
// sem runtime; usados por index.ts, triggers.ts e commands.ts.
// ============================================================================

export type NoaUiCommand =
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

export type AppCommandV1 = {
    kind: 'noa_command'
    command: NoaUiCommand
    requires_confirmation?: boolean
    reason?: string
}

export type PendingActionCandidate = {
    document_id: string
    title: string
    summary?: string
    content?: string
    audience?: string[]
    category?: string | null
    score?: number
}
