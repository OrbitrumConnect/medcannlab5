// ============================================================================
// triggers.ts — Triggers semânticos GPT→Core do tradevision-core.
// Extraído do index.ts no refator V1.9.419 (anti-bus-factor). Comportamento
// idêntico ao original — extração mecânica, sem mudança de lógica.
// ============================================================================

import type { AppCommandV1 } from "./types.ts"

// Contrato institucional (IMUTÁVEL): token base de agendamento
export const TRIGGER_SCHEDULING_TOKEN = '[TRIGGER_SCHEDULING]'
// Token universal de ação governada (app_commands/metadata) — sinal visual para o front; não dispara execução por si só
const TRIGGER_ACTION_TOKEN = '[TRIGGER_ACTION]'

// Triggers semânticos emitidos pelo GPT (modelo correto: GPT decide → Core governa → app_commands a partir do trigger).
// Alinhamento: avaliação clínica e agendamento são modelos selados (não editar). Todo o resto (terminal, abas, navegação, documentos)
// usa a mesma lógica — GPT emite tag → parseTriggersFromGPTResponse → stripGPTTriggerTags → filterAppCommandsByRole. Um fluxo, vários triggers.
export const GPT_TRIGGERS = {
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
    // 🧬 GATILHOS AEC (MOTOR CLÍNICO)
    AEC_RESUME_PROMPT: '[AEC_RESUME_PROMPT]',
    AEC_STOP_TRIGGER: '[AEC_STOP_TRIGGER]',
    AEC_COMPLETED: '[ASSESSMENT_COMPLETED]'
} as const

const PROFESSIONAL_DASHBOARD_ROUTE = '/app/clinica/profissional/dashboard'

/** Gera app_commands A PARTIR dos triggers emitidos pelo GPT (modelo selado). */
export function parseTriggersFromGPTResponse(aiResponse: string): AppCommandV1[] {
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
    // 🧬 Parsing de Comandos AEC
    if (text.includes(GPT_TRIGGERS.AEC_RESUME_PROMPT)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-route',
                target: '/aec-resume-confirmation',
                label: 'Confirmar Retomada AEC',
                payload: { action: 'show-resume-options' }
            },
            reason: 'aec_resume_orchestration'
        })
    }
    if (text.includes(GPT_TRIGGERS.AEC_STOP_TRIGGER)) {
        commands.push({
            kind: 'noa_command',
            command: {
                type: 'navigate-route',
                target: '/app/dashboard',
                label: 'Sair da Avaliação'
            },
            reason: 'aec_stop_requested'
        })
    }
    return commands
}

/** Remove todos os triggers emitidos pelo GPT do texto (usuário nunca vê). */
export function stripGPTTriggerTags(text: string): string {
    if (!text || typeof text !== 'string') return text || ''
    let out = text
    for (const tag of Object.values(GPT_TRIGGERS)) {
        out = out.replace(new RegExp(tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
    }
    return out.replace(/\n\s*\n\s*\n/g, '\n\n').trim()
}

/** Anexa TRIGGER_ACTION ao texto quando há app_commands, para sinalizar ações disponíveis (UX consistente). */
export function textWithActionToken(text: string, app_commands?: unknown[]): string {
    if (!text || !app_commands?.length) return text || ''
    const trimmed = (text || '').trim()
    return trimmed.endsWith(TRIGGER_ACTION_TOKEN) ? trimmed : `${trimmed} ${TRIGGER_ACTION_TOKEN}`
}
