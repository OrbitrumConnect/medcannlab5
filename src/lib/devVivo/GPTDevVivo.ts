// =====================================================
// GPT DEV VIVO - Núcleo de Alteração Assistida em Tempo Real
// MedCannLab 3.0 - Integração com Documento Mestre
// =====================================================

import { supabase } from '../supabase'
import { useAuth } from '../../contexts/AuthContext'
import type {
  DevVivoSession,
  DevVivoChange,
  DevVivoDiagnostics,
  DevVivoAuth,
  UpdateCodeRequest,
  PatchFunctionRequest,
  RollbackRequest
} from './types'

export class GPTDevVivo {
  private sessionId: string | null = null
  private auth: DevVivoAuth | null = null

  /**
   * Ativa o Modo Dev Vivo
   * Código de ativação: "Olá, Nôa. Modo Dev Vivo aqui."
   */
  async activate(supabaseToken: string, expiresInMinutes: number = 60): Promise<DevVivoSession> {
    try {
      // Obter usuário atual
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        throw new Error('Usuário não autenticado')
      }

      // Verificar se é admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, type, flag_admin')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        throw new Error('Erro ao buscar dados do usuário')
      }

      if (userData.type !== 'admin' || !userData.flag_admin) {
        throw new Error('Apenas administradores podem usar Modo Dev Vivo')
      }

      // Criar sessão via RPC
      const { data: sessionId, error: sessionError } = await supabase.rpc(
        'create_dev_vivo_session',
        {
          p_user_id: user.id,
          p_supabase_token: supabaseToken,
          p_expires_in_minutes: expiresInMinutes
        }
      )

      if (sessionError || !sessionId) {
        throw new Error('Erro ao criar sessão: ' + sessionError?.message)
      }

      this.sessionId = sessionId
      this.auth = {
        supabaseToken,
        userId: user.id,
        userType: userData.type as 'admin',
        flagAdmin: userData.flag_admin,
        canModifyCode: true,
        canModifyDatabase: true,
        canAccessRealData: false, // Por padrão, não acessa dados reais
        sessionId,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000)
      }

      return {
        id: sessionId,
        userId: user.id,
        supabaseToken,
        flagAdmin: userData.flag_admin,
        canModifyCode: true,
        canModifyDatabase: true,
        canAccessRealData: false,
        isActive: true,
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error: any) {
      console.error('❌ Erro ao ativar Modo Dev Vivo:', error)
      throw error
    }
  }

  /**
   * Obtém diagnóstico em tempo real
   */
  async getDiagnostics(): Promise<DevVivoDiagnostics> {
    if (!this.sessionId) {
      throw new Error('Modo Dev Vivo não está ativo')
    }

    try {
      // Coletar informações do sistema
      const currentRoute = window.location.pathname
      const queryParams = Object.fromEntries(new URLSearchParams(window.location.search))
      
      // Buscar diagnóstico do banco (se houver)
      const { data: diagnostics, error } = await supabase
        .from('dev_vivo_diagnostics')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.warn('⚠️ Erro ao buscar diagnóstico:', error)
      }

      return {
        currentRoute,
        routeParams: {},
        queryParams,
        currentComponent: diagnostics?.current_component,
        componentProps: diagnostics?.component_props || {},
        componentState: diagnostics?.component_state || {},
        recentErrors: diagnostics?.recent_errors || [],
        recentWarnings: diagnostics?.recent_warnings || [],
        supabaseConnections: diagnostics?.supabase_connections || [],
        apiCalls: diagnostics?.api_calls || [],
        realtimeSubscriptions: diagnostics?.realtime_subscriptions || [],
        renderTime: diagnostics?.render_time,
        memoryUsage: diagnostics?.memory_usage,
        networkLatency: diagnostics?.network_latency
      }
    } catch (error: any) {
      console.error('❌ Erro ao obter diagnóstico:', error)
      throw error
    }
  }

  /**
   * Registra uma mudança no código
   */
  async registerChange(
    changeType: 'create' | 'update' | 'delete' | 'patch',
    filePath: string,
    oldContent?: string,
    newContent?: string,
    reason?: string
  ): Promise<string> {
    if (!this.sessionId) {
      throw new Error('Modo Dev Vivo não está ativo')
    }

    try {
      const { data: changeId, error } = await supabase.rpc(
        'register_dev_vivo_change',
        {
          p_session_id: this.sessionId,
          p_change_type: changeType,
          p_file_path: filePath,
          p_old_content: oldContent || null,
          p_new_content: newContent || null,
          p_reason: reason || null
        }
      )

      if (error || !changeId) {
        throw new Error('Erro ao registrar mudança: ' + error?.message)
      }

      return changeId
    } catch (error: any) {
      console.error('❌ Erro ao registrar mudança:', error)
      throw error
    }
  }

  /**
   * Reverte uma mudança
   */
  async rollback(changeId: string, reason?: string): Promise<boolean> {
    if (!this.sessionId) {
      throw new Error('Modo Dev Vivo não está ativo')
    }

    try {
      const { data: success, error } = await supabase.rpc(
        'rollback_dev_vivo_change',
        {
          p_change_id: changeId,
          p_rollback_reason: reason || 'Rollback solicitado pelo usuário'
        }
      )

      if (error || !success) {
        throw new Error('Erro ao reverter mudança: ' + error?.message)
      }

      return success
    } catch (error: any) {
      console.error('❌ Erro ao reverter mudança:', error)
      throw error
    }
  }

  /**
   * Obtém histórico de mudanças
   */
  async getChangeHistory(limit: number = 10): Promise<DevVivoChange[]> {
    if (!this.sessionId) {
      throw new Error('Modo Dev Vivo não está ativo')
    }

    try {
      const { data: changes, error } = await supabase
        .from('dev_vivo_changes')
        .select('*')
        .eq('session_id', this.sessionId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error('Erro ao buscar histórico: ' + error.message)
      }

      return (changes || []).map(change => ({
        id: change.id,
        userId: change.user_id,
        sessionId: change.session_id,
        changeType: change.change_type,
        filePath: change.file_path,
        oldContent: change.old_content,
        newContent: change.new_content,
        reason: change.reason,
        status: change.status,
        appliedAt: change.applied_at ? new Date(change.applied_at) : undefined,
        rolledBackAt: change.rolled_back_at ? new Date(change.rolled_back_at) : undefined,
        rollbackReason: change.rollback_reason,
        signature: change.signature,
        errorMessage: change.error_message,
        createdAt: new Date(change.created_at),
        updatedAt: new Date(change.updated_at)
      }))
    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico:', error)
      throw error
    }
  }

  /**
   * Desativa o Modo Dev Vivo
   */
  async deactivate(): Promise<void> {
    if (!this.sessionId) {
      return
    }

    try {
      await supabase
        .from('dev_vivo_sessions')
        .update({ is_active: false })
        .eq('id', this.sessionId)

      this.sessionId = null
      this.auth = null
    } catch (error: any) {
      console.error('❌ Erro ao desativar Modo Dev Vivo:', error)
      throw error
    }
  }

  /**
   * Verifica se está ativo
   */
  isActive(): boolean {
    return this.sessionId !== null && this.auth !== null
  }

  /**
   * Obtém sessão atual
   */
  getSession(): DevVivoSession | null {
    return this.auth ? {
      id: this.sessionId!,
      userId: this.auth.userId,
      supabaseToken: this.auth.supabaseToken,
      flagAdmin: this.auth.flagAdmin,
      canModifyCode: this.auth.canModifyCode,
      canModifyDatabase: this.auth.canModifyDatabase,
      canAccessRealData: this.auth.canAccessRealData,
      isActive: true,
      expiresAt: this.auth.expiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    } : null
  }
}

// Instância singleton
export const gptDevVivo = new GPTDevVivo()

