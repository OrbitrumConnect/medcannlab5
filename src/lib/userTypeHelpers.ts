// 🔧 HELPERS PARA COMPARAÇÃO DE TIPOS DE USUÁRIO
// SEMPRE USE ESTAS FUNÇÕES EM VEZ DE COMPARAR DIRETAMENTE
// Isso garante consistência em todo o código

import { UserType, normalizeUserType } from './userTypes'

/**
 * Compara o tipo do usuário com um tipo esperado (aceita português ou inglês)
 * SEMPRE use esta função em vez de comparar diretamente user.type === 'professional'
 */
export const isUserType = (userType: string | undefined | null, expectedType: UserType | 'professional' | 'patient' | 'student'): boolean => {
  if (!userType) return false
  const normalized = normalizeUserType(userType)
  const normalizedExpected = normalizeUserType(expectedType)
  return normalized === normalizedExpected
}

/**
 * Verifica se o usuário é profissional
 */
export const isProfessional = (userType: string | undefined | null): boolean => {
  return isUserType(userType, 'profissional')
}

/**
 * Verifica se o usuário é paciente
 */
export const isPatient = (userType: string | undefined | null): boolean => {
  return isUserType(userType, 'paciente')
}

/**
 * Verifica se o usuário é aluno
 */
export const isStudent = (userType: string | undefined | null): boolean => {
  return isUserType(userType, 'aluno')
}

/**
 * Verifica se o usuário é admin
 */
export const isAdmin = (userType: string | undefined | null): boolean => {
  return isUserType(userType, 'admin')
}

/**
 * Verifica se o usuário é profissional OU admin
 */
export const isProfessionalOrAdmin = (userType: string | undefined | null): boolean => {
  return isProfessional(userType) || isAdmin(userType)
}

/**
 * Verifica se o usuário pode gerenciar pacientes (profissional ou admin)
 */
export const canManagePatients = (userType: string | undefined | null): boolean => {
  return isProfessionalOrAdmin(userType)
}

