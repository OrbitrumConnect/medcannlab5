// =====================================================
// TIPOS PARA MODO DEV VIVO
// MedCannLab 3.0 - Desenvolvimento em Tempo Real
// =====================================================

export interface DevVivoSession {
  id: string
  userId: string
  supabaseToken: string
  flagAdmin: boolean
  canModifyCode: boolean
  canModifyDatabase: boolean
  canAccessRealData: boolean
  currentRoute?: string
  currentComponent?: string
  isActive: boolean
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface DevVivoChange {
  id: string
  userId: string
  sessionId: string
  changeType: 'create' | 'update' | 'delete' | 'patch'
  filePath: string
  oldContent?: string
  newContent?: string
  reason?: string
  status: 'pending' | 'applied' | 'rolled_back' | 'failed'
  appliedAt?: Date
  rolledBackAt?: Date
  rollbackReason?: string
  signature?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface DevVivoDiagnostics {
  // Rota e Navegação
  currentRoute: string
  routeParams: Record<string, any>
  queryParams: Record<string, any>
  
  // Componente Atual
  currentComponent?: string
  componentProps?: Record<string, any>
  componentState?: Record<string, any>
  
  // Erros e Warnings
  recentErrors: ErrorLog[]
  recentWarnings: WarningLog[]
  
  // Dados Vinculados
  supabaseConnections: ConnectionStatus[]
  apiCalls: APICall[]
  realtimeSubscriptions: Subscription[]
  
  // Performance
  renderTime?: number
  memoryUsage?: number
  networkLatency?: number
}

export interface ErrorLog {
  id: string
  message: string
  stack?: string
  component?: string
  timestamp: Date
}

export interface WarningLog {
  id: string
  message: string
  component?: string
  timestamp: Date
}

export interface ConnectionStatus {
  id: string
  type: 'supabase' | 'api' | 'websocket'
  status: 'connected' | 'disconnected' | 'error'
  lastActivity?: Date
}

export interface APICall {
  id: string
  method: string
  url: string
  status: number
  duration: number
  timestamp: Date
}

export interface Subscription {
  id: string
  channel: string
  status: 'subscribed' | 'unsubscribed' | 'error'
  timestamp: Date
}

export interface DevVivoAuth {
  supabaseToken: string
  userId: string
  userType: 'admin' | 'professional' | 'aluno' | 'paciente'
  flagAdmin: boolean
  canModifyCode: boolean
  canModifyDatabase: boolean
  canAccessRealData: boolean
  sessionId: string
  expiresAt: Date
}

export interface SecurityRules {
  requiresAdmin: boolean
  realDataAccess: {
    requiresFlag: string
    requiresLog: boolean
    requiresSignature: boolean
  }
  protectedFiles: string[]
  codeValidation: {
    noEval: boolean
    noFunctionConstructor: boolean
    noDangerousImports: boolean
  }
}

export interface UpdateCodeRequest {
  filePath: string
  content: string
  changeType: 'create' | 'update' | 'delete'
  reason: string
}

export interface PatchFunctionRequest {
  filePath: string
  functionName: string
  patch: string
  reason: string
}

export interface RollbackRequest {
  changeId: string
  reason: string
}

