// Sistema de Permissões Administrativas
// Permite que admin acesse todos os dados da plataforma

import { supabase } from './supabase'
import { normalizeUserType } from './userTypes'

// ADMIN_EMAILS removidos conforme Protocolo de Segurança (Phase 5)
// Acesso deve ser governado estritamente por flag_admin no banco de dados.

/**
 * Verifica se um usuário é admin
 */
export const isAdmin = (user: { email?: string; type?: string } | null): boolean => {
  if (!user) return false

  // Verificar flag_admin (Prioridade)
  if ((user as any).flag_admin === true) return true;

  // Email Check removido - violação de segurança
  // if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) ...

  // Verificar tipo
  const normalizedType = normalizeUserType(user.type)
  return normalizedType === 'admin'
}

/**
 * Buscar todos os pacientes (admin tem acesso completo)
 */
export const getAllPatients = async (userId: string, userType: string) => {
  try {
    const isUserAdmin = isAdmin({ type: userType })

    if (isUserAdmin) {
      // ADMIN: Busca direta na tabela de usuários para obter nomes reais
      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at')
        .eq('type', 'paciente')
        .order('name', { ascending: true })

      if (error) throw error

      return users.map(u => ({
        id: u.id,
        name: u.name || `Paciente ${u.id.slice(0, 8)}`,
        email: u.email || '',
        phone: u.phone || '',
        status: 'Ativo',
        lastVisit: new Date(u.created_at).toLocaleDateString('pt-BR'),
        assessments: []
      }))
    } else {
      // PROFISSIONAL: Busca pacientes vinculados via avaliações ou agendamentos
      // Primeiro, pegamos os IDs dos pacientes atendidos por este profissional
      const { data: assessments, error: assError } = await supabase
        .from('clinical_assessments')
        .select('patient_id')
        .eq('doctor_id', userId)

      if (assError) throw assError

      const patientIds = Array.from(new Set(assessments?.map(a => a.patient_id).filter(Boolean)))

      if (patientIds.length === 0) return []

      // Buscamos os nomes reais desses pacientes na tabela users
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, name, email, phone, created_at')
        .in('id', patientIds)
        .order('name', { ascending: true })

      if (userError) throw userError

      return users.map(u => ({
        id: u.id,
        name: u.name || `Paciente ${u.id.slice(0, 8)}`,
        email: u.email || '',
        phone: u.phone || '',
        status: 'Em acompanhamento',
        lastVisit: new Date(u.created_at).toLocaleDateString('pt-BR'),
        assessments: []
      }))
    }
  } catch (error) {
    console.error('❌ Erro ao buscar pacientes com nomes reais:', error)
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


