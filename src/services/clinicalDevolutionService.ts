/**
 * Clinical Devolution Service — Sprint 1 V1 ASSÍNCRONA
 *
 * Fecha o ciclo médico→paciente que estava aberto:
 *   AEC → relatório → Pipeline RATIONALITY → MÉDICO REVISA → DEVOLUTION → paciente
 *
 * REUSO 100% schema existente em clinical_reports:
 *   • review_status      ('draft' | 'reviewed' | 'approved' | 'rejected')
 *   • reviewed_by        uuid do médico
 *   • reviewed_at        timestamp
 *   • content.doctor_notes  (campo JSONB já lido em ClinicalReports.tsx:415)
 *
 * ZERO tabela nova. ZERO toque CORE / AEC FSM / Lock V1.9.95+97+98+99-B.
 *
 * Notification type 'clinical_devolution' adicionado em notificationService.
 *
 * Bug latente corrigido: handleReviewReport antigo atualizava 'status' (campo do FSM
 * AEC) em vez de 'review_status' (campo de revisão médica). Por isso 104/104 ficaram
 * em draft empíricamente. Este service usa o campo correto.
 */

import { supabase } from '../lib/supabase'
import { notificationService } from './notificationService'

export type DevolutionStatus = 'draft' | 'reviewed' | 'approved' | 'rejected'

export interface ApproveAndDeliverParams {
    reportId: string
    reviewerId: string
    reviewerName?: string
    patientId: string
    patientName?: string
    doctorNotes: string
    /** Se true, registra ICP-Brasil signature (default false — Princípio 42) */
    signWithIcp?: boolean
    /** Se true, dispara email via send-email Edge (default false) */
    sendEmail?: boolean
}

export interface ApproveAndDeliverResult {
    ok: boolean
    error?: string
    notificationId?: string
}

class ClinicalDevolutionService {
    /**
     * Aprova um relatório clínico e devolve ao paciente.
     *
     * Atualizações atômicas:
     *  1) clinical_reports.review_status = 'approved'
     *  2) clinical_reports.reviewed_by = reviewerId
     *  3) clinical_reports.reviewed_at = now()
     *  4) clinical_reports.content.doctor_notes = doctorNotes (preserva resto do JSONB)
     *  5) Cria notification type='clinical_devolution' pro paciente
     *  6) (opcional) Email Resend via send-email Edge
     */
    async approveAndDeliver(params: ApproveAndDeliverParams): Promise<ApproveAndDeliverResult> {
        const {
            reportId,
            reviewerId,
            reviewerName,
            patientId,
            patientName,
            doctorNotes,
            signWithIcp = false,
            sendEmail = false
        } = params

        if (!reportId || !reviewerId || !patientId) {
            return { ok: false, error: 'Parâmetros obrigatórios ausentes (reportId/reviewerId/patientId)' }
        }

        if (!doctorNotes || doctorNotes.trim().length < 3) {
            return { ok: false, error: 'Nota clínica vazia ou muito curta — escreva ao menos uma frase.' }
        }

        try {
            // 1) Carregar conteúdo atual pra preservar JSONB
            const { data: existing, error: loadErr } = await supabase
                .from('clinical_reports')
                .select('content')
                .eq('id', reportId)
                .single()

            if (loadErr) {
                console.error('[clinicalDevolutionService] Erro ao carregar report:', loadErr)
                return { ok: false, error: 'Não foi possível carregar o relatório.' }
            }

            const currentContent = (existing?.content && typeof existing.content === 'object')
                ? (existing.content as Record<string, unknown>)
                : {}

            const mergedContent = {
                ...currentContent,
                doctor_notes: doctorNotes.trim(),
                doctor_notes_at: new Date().toISOString(),
                doctor_notes_by: reviewerId,
                review_status: 'approved'
            }

            // 2) Atualizar campos canônicos de revisão (NÃO tocar status do FSM)
            const { error: updErr } = await supabase
                .from('clinical_reports')
                .update({
                    review_status: 'approved',
                    reviewed_by: reviewerId,
                    reviewed_at: new Date().toISOString(),
                    content: mergedContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId)

            if (updErr) {
                console.error('[clinicalDevolutionService] Erro ao atualizar review:', updErr)
                return { ok: false, error: 'Falha ao registrar devolução clínica.' }
            }

            // 3) Notificação pro paciente
            const docLabel = reviewerName ? `Dr. ${reviewerName}` : 'Seu médico'
            const previewLen = 120
            const preview = doctorNotes.trim().slice(0, previewLen)
                + (doctorNotes.trim().length > previewLen ? '…' : '')

            const notif = await notificationService.createNotification({
                user_id: patientId,
                type: 'clinical_devolution',
                title: '👨‍⚕️ Devolução do seu médico',
                message: `${docLabel} revisou seu relatório clínico: ${preview}`,
                is_read: false,
                metadata: {
                    report_id: reportId,
                    reviewer_id: reviewerId,
                    reviewer_name: reviewerName,
                    action_url: `/app/clinica/paciente?section=relatorio&report=${encodeURIComponent(reportId)}`,
                    signed_with_icp: signWithIcp
                }
            })

            // 4) Email opcional (não bloqueia se falhar — Princípio defense in depth)
            if (sendEmail) {
                this.fireEmailDevolution({
                    patientId,
                    patientName,
                    reviewerName,
                    reportId,
                    preview
                }).catch(err => {
                    console.warn('[clinicalDevolutionService] Email não enviado (silent):', err)
                })
            }

            return { ok: true, notificationId: notif?.id }
        } catch (err: any) {
            console.error('[clinicalDevolutionService] Erro inesperado:', err)
            return { ok: false, error: err?.message || 'Erro inesperado ao registrar devolução.' }
        }
    }

    /**
     * Email opcional via Edge send-email (Resend). Não bloqueia o fluxo se falhar.
     */
    private async fireEmailDevolution(args: {
        patientId: string
        patientName?: string
        reviewerName?: string
        reportId: string
        preview: string
    }): Promise<void> {
        const { data: pat, error: patErr } = await supabase
            .from('users')
            .select('email, name')
            .eq('id', args.patientId)
            .maybeSingle()

        if (patErr || !pat?.email) return

        const subject = 'Devolução clínica do seu médico — MedCannLab'
        const docLabel = args.reviewerName ? `Dr. ${args.reviewerName}` : 'Seu médico'
        const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#f8fafc">
  <h2 style="color:#0f766e">${docLabel} revisou seu relatório clínico</h2>
  <p>Olá ${pat.name || args.patientName || ''},</p>
  <p>${docLabel} acabou de revisar seu relatório clínico e deixou observações para você:</p>
  <blockquote style="border-left:4px solid #10b981;padding:12px 16px;background:#ecfdf5;margin:16px 0;color:#064e3b">
    ${args.preview}
  </blockquote>
  <p>Acesse a plataforma MedCannLab para ver a devolução completa.</p>
  <p style="color:#64748b;font-size:12px;margin-top:24px">
    Esta é uma avaliação inicial assistida por IA, complementada por revisão clínica humana.
    Não substitui a consulta médica presencial.
  </p>
</div>`.trim()

        await supabase.functions.invoke('send-email', {
            body: { to: pat.email, subject, html }
        }).catch(() => { /* silent */ })
    }

    /**
     * Marca um relatório como "reviewed" (revisado mas sem devolução completa).
     * Útil pra médico marcar que VIU mas ainda não escreveu nota.
     */
    async markAsReviewed(reportId: string, reviewerId: string): Promise<{ ok: boolean; error?: string }> {
        if (!reportId || !reviewerId) {
            return { ok: false, error: 'Parâmetros obrigatórios ausentes' }
        }

        try {
            const { error } = await supabase
                .from('clinical_reports')
                .update({
                    review_status: 'reviewed',
                    reviewed_by: reviewerId,
                    reviewed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', reportId)

            if (error) {
                console.error('[clinicalDevolutionService] markAsReviewed error:', error)
                return { ok: false, error: 'Falha ao marcar como revisado.' }
            }

            return { ok: true }
        } catch (err: any) {
            console.error('[clinicalDevolutionService] markAsReviewed unexpected:', err)
            return { ok: false, error: err?.message || 'Erro inesperado.' }
        }
    }

    /**
     * Carrega devoluções recebidas por um paciente (review_status='approved').
     */
    async getPatientDevolutions(patientId: string, limit = 10) {
        if (!patientId) return []

        try {
            const { data, error } = await supabase
                .from('clinical_reports')
                .select('id, generated_at, reviewed_at, reviewed_by, content, professional_name, doctor_id')
                .eq('patient_id', patientId)
                .eq('review_status', 'approved')
                .order('reviewed_at', { ascending: false })
                .limit(limit)

            if (error) {
                console.warn('[clinicalDevolutionService] getPatientDevolutions:', error)
                return []
            }

            return (data || []).map((r: any) => {
                const content = (r.content && typeof r.content === 'object') ? r.content : {}
                return {
                    reportId: r.id as string,
                    generatedAt: r.generated_at as string | null,
                    reviewedAt: r.reviewed_at as string | null,
                    reviewerId: r.reviewed_by as string | null,
                    reviewerName: (r.professional_name as string) || null,
                    doctorNotes: (content.doctor_notes as string) || '',
                    doctorNotesAt: (content.doctor_notes_at as string) || null
                }
            }).filter(d => d.doctorNotes.length > 0)
        } catch (err) {
            console.warn('[clinicalDevolutionService] getPatientDevolutions unexpected:', err)
            return []
        }
    }
}

export const clinicalDevolutionService = new ClinicalDevolutionService()
