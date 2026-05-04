import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { clinicalReportService, ClinicalReport } from '../../lib/clinicalReportService'

export interface Appointment {
    id: string
    date: string
    time: string
    professional: string
    type: string
    status: 'scheduled' | 'completed' | 'cancelled'
}

export interface TherapeuticPlan {
    id: string
    title: string
    progress: number
    medications: Array<{ name: string; dosage: string; frequency: string }>
    nextReview: string
}

export interface PatientPrescriptionSummary {
    id: string
    title: string
    rationality: string | null
    dosage: string | null
    frequency: string | null
    status: 'draft' | 'active' | 'completed' | 'suspended' | 'cancelled'
    issuedAt: string
    startsAt: string | null
    endsAt: string | null
    professionalName: string | null
    planTitle: string | null
}

export type PatientTab = 'dashboard' | 'agendamento' | 'meus-agendamentos' | 'plano' | 'conteudo' | 'chat' | 'chat-noa' | 'perfil' | 'reportar-problema' | 'analytics' | 'report-detail' | 'minhas-prescricoes'

export function usePatientDashboard() {
    const { user } = useAuth()

    const [reports, setReports] = useState<ClinicalReport[]>([])
    const [loading, setLoading] = useState(true)
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [therapeuticPlan, setTherapeuticPlan] = useState<TherapeuticPlan | null>(null)
    const [activeTab, setActiveTab] = useState<PatientTab>('analytics')
    const [patientPrescriptions, setPatientPrescriptions] = useState<PatientPrescriptionSummary[]>([])

    const loadPatientData = useCallback(async () => {
        if (!user?.id) return
        setLoading(true)
        const patientId = user.id

        try {
            // 1. Clinical Reports
            try {
                const patientReports = await clinicalReportService.getPatientReports(patientId)
                setReports(patientReports)
            } catch (e) { console.warn(e); setReports([]) }

            // 2. Appointments
            try {
                const { data, error } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('patient_id', patientId)
                    .order('appointment_date', { ascending: true })
                    .limit(20)

                if (error) throw error
                setAppointments(data?.map((apt: any) => ({
                    id: apt.id,
                    date: apt.appointment_date,
                    time: apt.appointment_time || '09:00',
                    professional: apt.professional_name || 'Equipe Clínica',
                    type: apt.appointment_type || 'Consulta',
                    status: apt.status || 'scheduled'
                })) || [])
            } catch (e) {
                // Fallback for appointments view
                const { data } = await (supabase as any).from('v_patient_appointments').select('*').eq('patient_id', patientId).limit(20)
                setAppointments(data?.map((apt: any) => ({
                    id: apt.id,
                    date: apt.appointment_date,
                    time: apt.appointment_time || apt.start_time || '09:00',
                    professional: apt.professional_name || apt.professional_full_name || 'Equipe Clínica',
                    type: apt.appointment_type || apt.type || 'Consulta',
                    status: apt.status || 'scheduled'
                })) || [])
            }

            // 3. Therapeutic Plan Construction (from latest report/assessment)
            const { data: reportData } = await supabase
                .from('clinical_reports')
                .select('*')
                .eq('patient_id', patientId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1)

            const latestReport = reportData?.[0]

            const { data: assessmentData } = await supabase
                .from('clinical_assessments')
                .select('*')
                .eq('patient_id', patientId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(1)

            const latestAssessment = assessmentData?.[0]

            let fallbackMedications: any[] = []
            let fallbackProgress = 0
            let fallbackNextReview = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

            if (latestReport?.content) {
                const content = latestReport.content as any
                fallbackMedications = content.plan?.medications || []
                const daysSinceCreation = Math.floor((Date.now() - new Date(latestReport.created_at).getTime()) / (1000 * 24 * 3600))
                fallbackProgress = Math.min(100, Math.max(10, daysSinceCreation))
                fallbackNextReview = new Date(Date.now() + 15 * 24 * 3600 * 1000)
            }

            const { data: planData } = await supabase
                .from('patient_therapeutic_plans')
                .select('id, title, summary, status')
                .eq('patient_id', patientId)
                .in('status', ['active', 'draft'])
                .maybeSingle()

            if (planData) {
                setTherapeuticPlan({
                    id: planData.id,
                    title: planData.title ?? 'Plano terapêutico personalizado',
                    progress: fallbackProgress,
                    medications: fallbackMedications.length ? fallbackMedications : [{ name: 'A definir', dosage: 'Sob medida', frequency: 'Segundo protocolo' }],
                    nextReview: fallbackNextReview.toLocaleDateString('pt-BR')
                })
            } else if (latestReport) {
                // Fallback A: Relatório completado
                const recommendations = (latestReport.content as any).recommendations || []
                setTherapeuticPlan({
                    id: latestReport.id,
                    title: 'Plano de Cuidado IMRE (IA)',
                    progress: fallbackProgress,
                    medications: recommendations.length > 0 
                        ? recommendations.map((rec: string) => ({ name: rec, dosage: 'Siga a orientação', frequency: 'Conforme indicado' }))
                        : [{ name: 'Aguardando validação profissional', dosage: 'Em análise', frequency: 'Consulte seu médico' }],
                    nextReview: fallbackNextReview.toLocaleDateString('pt-BR')
                })
            } else if (latestAssessment) {
                // Fallback B: Avaliação completada mas sem relatório formal ainda
                setTherapeuticPlan({
                    id: latestAssessment.id,
                    title: 'Plano Preliminar (Pós-Avaliação)',
                    progress: 20,
                    medications: [{ name: 'Protocolo em geração', dosage: 'Aguarde a Nôa', frequency: 'Disponível em breve' }],
                    nextReview: new Date(Date.now() + 7 * 24 * 3600 * 1000).toLocaleDateString('pt-BR')
                })
            }

            // 4. Prescriptions
            const { data: prescriptionsData } = await supabase
                .from('v_patient_prescriptions')
                .select('*')
                .eq('patient_id', patientId)
                .order('issued_at', { ascending: false })

            setPatientPrescriptions(prescriptionsData?.map((row: any) => ({
                id: row.id,
                title: row.title ?? row.template_title ?? 'Prescrição integrativa',
                rationality: row.rationality ?? row.template_rationality ?? null,
                dosage: row.dosage ?? row.template_dosage ?? null,
                frequency: row.frequency ?? row.template_frequency ?? null,
                status: row.status ?? 'draft',
                issuedAt: row.issued_at,
                startsAt: row.starts_at ?? null,
                endsAt: row.ends_at ?? null,
                professionalName: row.professional_name ?? null,
                planTitle: row.plan_title ?? null
            })) || [])

        } catch (err) {
            console.error('Patient dashboard hook error:', err)
        } finally {
            setLoading(false)
        }
    }, [user?.id])

    useEffect(() => {
        loadPatientData()
    }, [loadPatientData])

    return {
        reports,
        loading,
        appointments,
        therapeuticPlan,
        activeTab,
        setActiveTab,
        patientPrescriptions,
        refresh: loadPatientData
    }
}
