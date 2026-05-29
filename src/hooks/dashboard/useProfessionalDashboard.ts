import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { isAdmin, getAllPatients } from '../../lib/adminPermissions'
import { useUserView } from '../useUserView'

export interface Patient {
    id: string
    name: string
    age: number
    cpf: string
    phone: string
    lastVisit: string
    email: string
    status: 'active' | 'inactive' | 'pending'
    assessments?: any[]
    condition?: string
    priority?: 'high' | 'medium' | 'low'
}

export type ProSection = 'dashboard' | 'prescriptions' | 'clinical-reports' | 'agendamentos' | 'incentivos'

// V1.9.502 (29/05) — stats reais substituindo mocks {8}/{3}/"+12%" do dashboard.
// Atividade Recente também deriva de reports últimos 7d (era hardcoded).
export interface ProfessionalDashboardStats {
    appointmentsToday: number
    reportsLast7d: number
    recentActivity: Array<{ id: string; label: string; createdAt: string; kind: 'report' | 'appointment' }>
}

export function useProfessionalDashboard() {
    const { user } = useAuth()
    const { getEffectiveUserType } = useUserView()

    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState<ProSection>('dashboard')
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null)
    const [stats, setStats] = useState<ProfessionalDashboardStats>({
        appointmentsToday: 0,
        reportsLast7d: 0,
        recentActivity: [],
    })

    const userIsAdmin = isAdmin(user)
    const effectiveType = getEffectiveUserType(user?.type)

    const loadPatients = useCallback(async () => {
        try {
            setLoading(true)

            // Admin REAL sem simulação OU "vendo como admin" → todos os pacientes.
            // Admin "vendo como profissional" → cai no else e vê só seus vinculados.
            if (userIsAdmin && (effectiveType === 'admin' || !effectiveType)) {
                const allPatients = await getAllPatients(user, effectiveType)
                const mappedPatients: Patient[] = allPatients.map(p => ({
                    ...p,
                    status: 'active' as const,
                    assessments: p.assessments || []
                }))
                setPatients(mappedPatients)
                return
            }

            const { data: assessments, error } = await supabase
                .from('clinical_assessments')
                .select(`
          *,
          patient:patient_id,
          doctor:doctor_id
        `)
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error

            const patientsMap = new Map<string, Patient>()
            assessments?.forEach((assessment: any) => {
                const patientId = assessment.patient_id
                if (!patientsMap.has(patientId)) {
                    patientsMap.set(patientId, {
                        id: patientId,
                        name: assessment.patient_name || `Paciente ${patientId.slice(0, 8)}`,
                        age: assessment.patient_age || 0,
                        cpf: assessment.patient_cpf || '',
                        phone: assessment.patient_phone || '',
                        email: '',
                        lastVisit: new Date(assessment.created_at).toLocaleDateString('pt-BR'),
                        status: 'active' as const,
                        condition: assessment.condition || 'Geral',
                        priority: assessment.priority || 'medium',
                        assessments: []
                    })
                }
                patientsMap.get(patientId)!.assessments?.push(assessment)
            })

            setPatients(Array.from(patientsMap.values()))
        } catch (error) {
            console.error('Error loading patients:', error)
        } finally {
            setLoading(false)
        }
    }, [user?.id, userIsAdmin, effectiveType])

    useEffect(() => {
        if (user?.id) loadPatients()
    }, [loadPatients, user?.id])

    // V1.9.502 — stats reais (substitui mocks hardcoded {8}/{3}/+12%)
    const loadStats = useCallback(async () => {
        try {
            const todayStart = new Date()
            todayStart.setHours(0, 0, 0, 0)
            const todayEnd = new Date()
            todayEnd.setHours(23, 59, 59, 999)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

            const [apptsRes, reportsRes, recentRes] = await Promise.all([
                supabase
                    .from('appointments')
                    .select('id', { count: 'exact', head: true })
                    .gte('appointment_date', todayStart.toISOString())
                    .lte('appointment_date', todayEnd.toISOString()),
                supabase
                    .from('clinical_reports')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', sevenDaysAgo.toISOString()),
                supabase
                    .from('clinical_reports')
                    .select('id, patient_name, report_type, created_at')
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(5),
            ])

            const recentActivity = (recentRes.data || []).map((r: any) => ({
                id: r.id,
                label: r.report_type === 'follow_up'
                    ? `Evolução • ${r.patient_name || 'Paciente'}`
                    : `Relatório clínico • ${r.patient_name || 'Paciente'}`,
                createdAt: r.created_at,
                kind: 'report' as const,
            }))

            setStats({
                appointmentsToday: apptsRes.count ?? 0,
                reportsLast7d: reportsRes.count ?? 0,
                recentActivity,
            })
        } catch (error) {
            console.warn('[useProfessionalDashboard.loadStats] erro:', error)
        }
    }, [])

    useEffect(() => {
        if (user?.id) loadStats()
    }, [loadStats, user?.id])

    const selectPatient = (id: string | null) => {
        setSelectedPatientId(id)
        if (id) {
            const p = patients.find(patient => patient.id === id)
            setSelectedPatientData(p || null)
        } else {
            setSelectedPatientData(null)
        }
    }

    return {
        patients,
        loading,
        activeSection,
        setActiveSection,
        selectedPatientId,
        selectedPatientData,
        selectPatient,
        stats,
        refresh: loadPatients
    }
}
