/**
 * TITAN 3.2 IDENTITY BRIDGE
 * Sistema Unificado de Tipos de Usuário - MedCannLab 3.2
 * Normaliza os tipos entre o legado (English) e o padrão Titan (Português).
 */

export type UserType = 'admin' | 'professional' | 'profissional' | 'patient' | 'paciente' | 'student' | 'aluno' | 'master' | 'unknown';

/**
 * Função para normalizar tipo de usuário.
 * Mapeia as diferentes strings (English/PT) para os tipos canônicos usados no sistema.
 */
export function normalizeUserType(type: string | undefined | null): UserType {
  if (!type) return 'unknown';
  const norm = type.toLowerCase().trim();
  
  if (norm.includes('master')) return 'master';
  if (norm.includes('admin')) return 'admin';
  if (norm.includes('profissional') || norm.includes('professional')) return 'profissional'; 
  if (norm.includes('paciente') || norm.includes('patient')) return 'paciente';
  if (norm.includes('aluno') || norm.includes('student')) return 'aluno';
  
  return 'unknown';
}

/**
 * Converte para o padrão English usado em algumas partes do backend legado.
 */
export function toEnglishType(type: string | undefined | null): string {
  const norm = normalizeUserType(type);
  switch (norm) {
    case 'profissional': return 'professional';
    case 'paciente': return 'patient';
    case 'aluno': return 'student';
    default: return norm;
  }
}

/**
 * Validação simples de tipo.
 */
export function isValidUserType(type: string | undefined | null): boolean {
  return normalizeUserType(type) !== 'unknown';
}

/**
 * Retorna o rótulo amigável para exibição na UI.
 */
export function getUserTypeLabel(type: string | undefined | null): string {
  const normalized = normalizeUserType(type);
  switch (normalized) {
    case 'admin': return 'Administrador';
    case 'profissional': return 'Profissional';
    case 'paciente': return 'Paciente';
    case 'aluno': return 'Aluno';
    case 'master': return 'Master';
    default: return 'Usuário';
  }
}

/**
 * Retorna a rota padrão baseada no tipo de usuário (DECISAO_SELADA_ROTAS_CANONICAS_V1).
 */
export function getDefaultRouteByType(type: string | undefined | null): string {
  const normalized = normalizeUserType(type);
  switch (normalized) {
    case 'aluno': return '/app/ensino/aluno/dashboard';
    case 'profissional': return '/app/clinica/profissional/dashboard';
    case 'paciente': return '/app/clinica/paciente/dashboard?section=analytics';
    case 'admin': 
    case 'master': return '/app/admin';
    default: return '/';
  }
}

export interface UserPermissions {
  canAccessClinica: boolean
  canAccessEnsino: boolean
  canAccessPesquisa: boolean
  canManagePatients: boolean
  canManageCourses: boolean
  canManageUsers: boolean
  canAccessAdmin: boolean
  canChatProfessional: boolean
  canChatPatient: boolean
  canChatGlobal: boolean
}

/**
 * Retorna as permissões baseadas no tipo de usuário.
 */
export function getUserPermissions(type: string | undefined | null): UserPermissions {
  const normalized = normalizeUserType(type);
  
  const permissions: Record<string, UserPermissions> = {
    'aluno': {
      canAccessClinica: false,
      canAccessEnsino: true,
      canAccessPesquisa: true,
      canManagePatients: false,
      canManageCourses: false,
      canManageUsers: false,
      canAccessAdmin: false,
      canChatProfessional: false,
      canChatPatient: false,
      canChatGlobal: true,
    },
    'profissional': {
      canAccessClinica: true,
      canAccessEnsino: true,
      canAccessPesquisa: true,
      canManagePatients: true,
      canManageCourses: true,
      canManageUsers: false,
      canAccessAdmin: false,
      canChatProfessional: true,
      canChatPatient: true,
      canChatGlobal: true,
    },
    'paciente': {
      canAccessClinica: true,
      canAccessEnsino: false,
      canAccessPesquisa: false,
      canManagePatients: false,
      canManageCourses: false,
      canManageUsers: false,
      canAccessAdmin: false,
      canChatProfessional: true,
      canChatPatient: false,
      canChatGlobal: true,
    },
    'admin': {
      canAccessClinica: true,
      canAccessEnsino: true,
      canAccessPesquisa: true,
      canManagePatients: true,
      canManageCourses: true,
      canManageUsers: true,
      canAccessAdmin: true,
      canChatProfessional: true,
      canChatPatient: true,
      canChatGlobal: true,
    },
    'master': {
      canAccessClinica: true,
      canAccessEnsino: true,
      canAccessPesquisa: true,
      canManagePatients: true,
      canManageCourses: true,
      canManageUsers: true,
      canAccessAdmin: true,
      canChatProfessional: true,
      canChatPatient: true,
      canChatGlobal: true,
    },
    'unknown': {
      canAccessClinica: false,
      canAccessEnsino: false,
      canAccessPesquisa: false,
      canManagePatients: false,
      canManageCourses: false,
      canManageUsers: false,
      canAccessAdmin: false,
      canChatProfessional: false,
      canChatPatient: false,
      canChatGlobal: false,
    }
  };
  
  return permissions[normalized] || permissions['unknown'];
}
