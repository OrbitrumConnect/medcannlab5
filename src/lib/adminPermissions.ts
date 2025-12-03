// Sistema de Permissões Administrativas
// Permite que admin acesse todos os dados da plataforma

import { supabase } from './supabase'
import { normalizeUserType } from './userTypes'

// IDs de emails de admin com acesso completo
const ADMIN_EMAILS = [
  'rrvalenca@gmail.com',
  'rrvlenca@gmail.com',
  'profrvalenca@gmail.com',
  'iaianoaesperanza@gmail.com'
]

/**
 * Verifica se um usuário é admin
 */
export const isAdmin = (user: { email?: string; type?: string } | null): boolean => {
  if (!user) return false
  
  // Verificar email
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return true
  }
  
  // Verificar tipo
  const normalizedType = normalizeUserType(user.type)
  return normalizedType === 'admin'
}

/**
 * Buscar todos os pacientes (admin tem acesso completo)
 */
export const getAllPatients = async (userId: string, userType: string) => {
  try {
    // Se for admin, buscar todos os pacientes sem filtro
    if (isAdmin({ type: userType })) {
      // 1. Buscar avaliações clínicas
      const { data: assessments, error } = await supabase
        .from('clinical_assessments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar pacientes (admin):', error)
        throw error
      }

      // 2. Buscar nomes dos pacientes da tabela users
      const patientIds = [...new Set(assessments?.map(a => a.patient_id).filter(Boolean) || [])]
      const patientNamesMap = new Map<string, { name: string; email?: string; phone?: string; cpf?: string }>()
      
      if (patientIds.length > 0) {
        // Tentar buscar da tabela users primeiro
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, phone, cpf')
          .in('id', patientIds)
        
        if (!usersError && usersData) {
          usersData.forEach(user => {
            if (user.name) {
              patientNamesMap.set(user.id, {
                name: user.name,
                email: user.email,
                phone: user.phone,
                cpf: user.cpf
              })
            }
          })
        }
        
        // Fallback: tentar users_compatible se não encontrou todos
        if (patientNamesMap.size < patientIds.length) {
          const missingIds = patientIds.filter(id => !patientNamesMap.has(id))
          if (missingIds.length > 0) {
            const { data: compatibleData, error: compatibleError } = await supabase
              .from('users_compatible')
              .select('id, name, email, phone, cpf')
              .in('id', missingIds)
            
            if (!compatibleError && compatibleData) {
              compatibleData.forEach(user => {
                if (user.name && !patientNamesMap.has(user.id)) {
                  patientNamesMap.set(user.id, {
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    cpf: user.cpf
                  })
                }
              })
            }
          }
        }
      }

      // 3. Agrupar por paciente
      const patientsMap = new Map()
      assessments?.forEach(assessment => {
        if (assessment.patient_id && !patientsMap.has(assessment.patient_id)) {
          const patientInfo = patientNamesMap.get(assessment.patient_id)
          const patientName = patientInfo?.name || 
                             assessment.patient_name || 
                             assessment.data?.name || 
                             `Paciente ${assessment.patient_id.slice(0, 8)}`
          
          patientsMap.set(assessment.patient_id, {
            id: assessment.patient_id,
            name: patientName,
            age: assessment.patient_age || assessment.data?.age || 0,
            cpf: patientInfo?.cpf || assessment.patient_cpf || assessment.data?.cpf || '',
            phone: patientInfo?.phone || assessment.patient_phone || assessment.data?.phone || '',
            email: patientInfo?.email || assessment.patient_email || assessment.data?.email || '',
            lastVisit: new Date(assessment.created_at).toLocaleDateString('pt-BR'),
            status: assessment.status || 'Aguardando',
            condition: assessment.condition || assessment.data?.complaintList?.[0] || 'Não especificado',
            priority: assessment.priority || 'medium',
            assessments: [assessment]
          })
        } else {
          const patient = patientsMap.get(assessment.patient_id)
          if (patient) {
            patient.assessments.push(assessment)
            // Atualizar última visita se for mais recente
            const visitDate = new Date(assessment.created_at)
            const lastVisit = new Date(patient.lastVisit.split('/').reverse().join('-'))
            if (visitDate > lastVisit) {
              patient.lastVisit = visitDate.toLocaleDateString('pt-BR')
            }
          }
        }
      })

      return Array.from(patientsMap.values())
    } else {
      // Usuário normal: buscar apenas seus próprios pacientes (com RLS)
      const { data: assessments, error } = await supabase
        .from('clinical_assessments')
        .select('*')
        .eq('doctor_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar pacientes:', error)
        throw error
      }

      const patientsMap = new Map()
      assessments?.forEach(assessment => {
        if (assessment.patient_id && !patientsMap.has(assessment.patient_id)) {
          patientsMap.set(assessment.patient_id, {
            id: assessment.patient_id,
            name: assessment.patient_name || `Paciente ${assessment.patient_id.slice(0, 8)}`,
            age: assessment.patient_age || 0,
            cpf: assessment.patient_cpf || '',
            phone: assessment.patient_phone || '',
            email: assessment.patient_email || '',
            lastVisit: new Date(assessment.created_at).toLocaleDateString('pt-BR'),
            status: assessment.status || 'Aguardando',
            condition: assessment.condition || 'Não especificado',
            priority: assessment.priority || 'medium',
            assessments: [assessment]
          })
        } else {
          const patient = patientsMap.get(assessment.patient_id)
          if (patient) {
            patient.assessments.push(assessment)
          }
        }
      })

      return Array.from(patientsMap.values())
    }
  } catch (error) {
    console.error('❌ Erro ao buscar pacientes:', error)
    throw error
  }
}

/**
 * Buscar prontuário completo de um paciente (admin tem acesso)
 */
export const getPatientMedicalRecord = async (patientId: string, userId: string, userType: string) => {
  try {
    // Admin pode ver qualquer prontuário
    if (isAdmin({ type: userType })) {
      const { data: records, error } = await supabase
        .from('patient_medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar prontuário (admin):', error)
        throw error
      }

      return records
    } else {
      // Usuário normal: apenas seus próprios registros ou pacientes associados
      const { data: records, error } = await supabase
        .from('patient_medical_records')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar prontuário:', error)
        throw error
      }

      return records
    }
  } catch (error) {
    console.error('❌ Erro ao buscar prontuário:', error)
    throw error
  }
}

/**
 * Buscar todos os profissionais (admin)
 */
export const getAllProfessionals = async (userType: string) => {
  try {
    if (!isAdmin({ type: userType })) {
      throw new Error('Apenas administradores podem acessar esta função')
    }

    const { data: profiles, error } = await supabase
      .from('users')
      .select('*')
      .in('type', ['professional', 'profissional', 'admin'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar profissionais:', error)
      throw error
    }

    return profiles || []
  } catch (error) {
    console.error('❌ Erro ao buscar profissionais:', error)
    throw error
  }
}

/**
 * Buscar todos os relatórios clínicos (admin)
 */
export const getAllClinicalReports = async (userType: string) => {
  try {
    if (!isAdmin({ type: userType })) {
      throw new Error('Apenas administradores podem acessar esta função')
    }

    const { data: reports, error } = await supabase
      .from('clinical_reports')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar relatórios clínicos:', error)
      throw error
    }

    return reports || []
  } catch (error) {
    console.error('❌ Erro ao buscar relatórios clínicos:', error)
    throw error
  }
}

/**
 * Buscar todas as avaliações clínicas (admin)
 */
export const getAllClinicalAssessments = async (userType: string) => {
  try {
    if (!isAdmin({ type: userType })) {
      throw new Error('Apenas administradores podem acessar esta função')
    }

    const { data: assessments, error } = await supabase
      .from('clinical_assessments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar avaliações:', error)
      throw error
    }

    return assessments || []
  } catch (error) {
    console.error('❌ Erro ao buscar avaliações:', error)
    throw error
  }
}


