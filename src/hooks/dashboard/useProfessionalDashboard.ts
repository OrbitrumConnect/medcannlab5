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

export function useProfessionalDashboard() {
    const { user } = useAuth()
    const { getEffectiveUserType } = useUserView()

    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [activeSection, setActiveSection] = useState<ProSection>('dashboard')
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
    const [selectedPatientData, setSelectedPatientData] = useState<Patient | null>(null)

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
        refresh: loadPatients
    }
}
