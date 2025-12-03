// =====================================================
// API ENDPOINTS - MODO DEV VIVO
// MedCannLab 3.0 - Desenvolvimento em Tempo Real
// =====================================================

import { supabase } from '../../lib/supabase'
import { gptDevVivo } from '../../lib/devVivo/GPTDevVivo'
import type { UpdateCodeRequest, PatchFunctionRequest, RollbackRequest } from '../../lib/devVivo/types'

/**
 * POST /admin/dev-vivo/update-code
 * Atualiza código de um arquivo
 */
export async function updateCode(request: UpdateCodeRequest, userId: string): Promise<{ success: boolean; changeId?: string; error?: string }> {
  try {
    // Validar autenticação
    const { data: user, error: authError } = await supabase
      .from('users')
      .select('id, type, flag_admin')
      .eq('id', userId)
      .single()

    if (authError || !user || user.type !== 'admin' || !user.flag_admin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem usar Modo Dev Vivo.' }
    }

    // Validar arquivo (não permitir arquivos protegidos)
    const protectedFiles = [
      'src/lib/supabase.ts',
      '.env',
      'package.json',
      'vite.config.ts',
      'tsconfig.json'
    ]

    if (protectedFiles.some(file => request.filePath.includes(file))) {
      return { success: false, error: 'Arquivo protegido. Não é possível modificar este arquivo.' }
    }

    // Validar código (sem eval, Function constructor, etc.)
    if (request.content.includes('eval(') || request.content.includes('Function(')) {
      return { success: false, error: 'Código inválido. Não é permitido usar eval() ou Function constructor.' }
    }

    // Registrar mudança
    const changeId = await gptDevVivo.registerChange(
      request.changeType,
      request.filePath,
      undefined, // oldContent será buscado se necessário
      request.content,
      request.reason
    )

    // TODO: Aplicar mudança no sistema de arquivos
    // Isso deve ser feito com cuidado e validação adicional

    return { success: true, changeId }
  } catch (error: any) {
    console.error('❌ Erro ao atualizar código:', error)
    return { success: false, error: error.message || 'Erro ao atualizar código' }
  }
}

/**
 * POST /admin/dev-vivo/patch-function
 * Aplica patch em uma função específica
 */
export async function patchFunction(request: PatchFunctionRequest, userId: string): Promise<{ success: boolean; changeId?: string; error?: string }> {
  try {
    // Validar autenticação
    const { data: user, error: authError } = await supabase
      .from('users')
      .select('id, type, flag_admin')
      .eq('id', userId)
      .single()

    if (authError || !user || user.type !== 'admin' || !user.flag_admin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem usar Modo Dev Vivo.' }
    }

    // Validar código
    if (request.patch.includes('eval(') || request.patch.includes('Function(')) {
      return { success: false, error: 'Código inválido. Não é permitido usar eval() ou Function constructor.' }
    }

    // Registrar mudança
    const changeId = await gptDevVivo.registerChange(
      'patch',
      request.filePath,
      undefined,
      request.patch,
      request.reason
    )

    // TODO: Aplicar patch na função específica

    return { success: true, changeId }
  } catch (error: any) {
    console.error('❌ Erro ao aplicar patch:', error)
    return { success: false, error: error.message || 'Erro ao aplicar patch' }
  }
}

/**
 * GET /admin/dev-vivo/diagnostics
 * Obtém diagnóstico em tempo real
 */
export async function getDiagnostics(userId: string): Promise<{ success: boolean; diagnostics?: any; error?: string }> {
  try {
    // Validar autenticação
    const { data: user, error: authError } = await supabase
      .from('users')
      .select('id, type, flag_admin')
      .eq('id', userId)
      .single()

    if (authError || !user || user.type !== 'admin' || !user.flag_admin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem usar Modo Dev Vivo.' }
    }

    // Obter diagnóstico
    const diagnostics = await gptDevVivo.getDiagnostics()

    return { success: true, diagnostics }
  } catch (error: any) {
    console.error('❌ Erro ao obter diagnóstico:', error)
    return { success: false, error: error.message || 'Erro ao obter diagnóstico' }
  }
}

/**
 * POST /admin/dev-vivo/rollback
 * Reverte uma mudança
 */
export async function rollback(request: RollbackRequest, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validar autenticação
    const { data: user, error: authError } = await supabase
      .from('users')
      .select('id, type, flag_admin')
      .eq('id', userId)
      .single()

    if (authError || !user || user.type !== 'admin' || !user.flag_admin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem usar Modo Dev Vivo.' }
    }

    // Reverter mudança
    const success = await gptDevVivo.rollback(request.changeId, request.reason)

    if (!success) {
      return { success: false, error: 'Erro ao reverter mudança' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('❌ Erro ao reverter mudança:', error)
    return { success: false, error: error.message || 'Erro ao reverter mudança' }
  }
}

/**
 * GET /admin/dev-vivo/history
 * Obtém histórico de mudanças
 */
export async function getHistory(userId: string, limit: number = 10): Promise<{ success: boolean; changes?: any[]; error?: string }> {
  try {
    // Validar autenticação
    const { data: user, error: authError } = await supabase
      .from('users')
      .select('id, type, flag_admin')
      .eq('id', userId)
      .single()

    if (authError || !user || user.type !== 'admin' || !user.flag_admin) {
      return { success: false, error: 'Acesso negado. Apenas administradores podem usar Modo Dev Vivo.' }
    }

    // Obter histórico
    const changes = await gptDevVivo.getChangeHistory(limit)

    return { success: true, changes }
  } catch (error: any) {
    console.error('❌ Erro ao obter histórico:', error)
    return { success: false, error: error.message || 'Erro ao obter histórico' }
  }
}

