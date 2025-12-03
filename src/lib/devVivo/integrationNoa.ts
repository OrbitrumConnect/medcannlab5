// =====================================================
// INTEGRAÇÃO MODO DEV VIVO COM NÔA ESPERANZA
// MedCannLab 3.0 - Processamento de Comandos
// =====================================================

import { gptDevVivo } from './GPTDevVivo'
import { supabase } from '../supabase'
import type { AIResponse } from '../noaResidentAI'

/**
 * Processa comandos do Modo Dev Vivo
 */
export async function processDevVivoCommand(
  message: string,
  userId?: string,
  userEmail?: string
): Promise<AIResponse | null> {
  if (!userId) {
    return null
  }

  const lowerMessage = message.toLowerCase().trim()

  // Comandos de ativação
  const activationCommands = [
    'ativar dev vivo',
    'ativar modo dev vivo',
    'modo desenvolvedor',
    'dev mode on',
    'olá, nôa. modo dev vivo aqui.',
    'ativar desenvolvimento em tempo real'
  ]

  if (activationCommands.some(cmd => lowerMessage.includes(cmd))) {
    return await handleActivation(userId, userEmail)
  }

  // Comandos de diagnóstico
  if (lowerMessage.includes('diagnóstico') || lowerMessage.includes('diagnostico')) {
    return await handleDiagnostics(userId)
  }

  // Comandos de rollback
  if (lowerMessage.includes('rollback') || lowerMessage.includes('reverter')) {
    return await handleRollback(message, userId)
  }

  // Comandos de histórico
  if (lowerMessage.includes('histórico') || lowerMessage.includes('historico') || lowerMessage.includes('mudanças')) {
    return await handleHistory(userId)
  }

  // Comandos de desativação
  if (lowerMessage.includes('desativar dev vivo') || lowerMessage.includes('sair do modo dev')) {
    return await handleDeactivation(userId)
  }

  return null
}

/**
 * Ativa o Modo Dev Vivo
 */
async function handleActivation(userId: string, userEmail?: string): Promise<AIResponse> {
  try {
    // Obter token do Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.access_token) {
      return {
        id: `error_${Date.now()}`,
        content: '❌ Erro: Não foi possível obter token de autenticação. Faça login novamente.',
        confidence: 1,
        reasoning: 'Token de autenticação não disponível',
        timestamp: new Date(),
        type: 'error'
      }
    }

    // Ativar Modo Dev Vivo
    const sessionData = await gptDevVivo.activate(session.access_token, 60)

    return {
      id: `dev_vivo_${Date.now()}`,
      content: `✅ **Modo Dev Vivo ativado com sucesso!**\n\n` +
        `📋 **Sessão criada:**\n` +
        `- ID: ${sessionData.id}\n` +
        `- Expira em: ${new Date(sessionData.expiresAt).toLocaleString('pt-BR')}\n` +
        `- Permissões: Código ✅ | Banco ✅ | Dados Reais ❌\n\n` +
        `🧠 **Comandos disponíveis:**\n` +
        `- "mostrar diagnóstico" - Ver informações do sistema\n` +
        `- "rollback última mudança" - Reverter última alteração\n` +
        `- "histórico de mudanças" - Ver mudanças recentes\n` +
        `- "desativar dev vivo" - Encerrar sessão\n\n` +
        `⚠️ **Lembrete:** Todas as alterações são registradas e auditáveis.`,
      confidence: 1,
      reasoning: 'Modo Dev Vivo ativado com sucesso',
      timestamp: new Date(),
      type: 'text',
      metadata: { sessionId: sessionData.id }
    }
  } catch (error: any) {
    return {
      id: `error_${Date.now()}`,
      content: `❌ **Erro ao ativar Modo Dev Vivo:**\n\n${error.message}\n\n` +
        `Verifique se você tem permissões de administrador (flag_admin = true).`,
      confidence: 1,
      reasoning: error.message,
      timestamp: new Date(),
      type: 'error'
    }
  }
}

/**
 * Mostra diagnóstico do sistema
 */
async function handleDiagnostics(userId: string): Promise<AIResponse> {
  try {
    if (!gptDevVivo.isActive()) {
      return {
        id: `error_${Date.now()}`,
        content: '❌ Modo Dev Vivo não está ativo. Use "ativar dev vivo" primeiro.',
        confidence: 1,
        reasoning: 'Sessão não ativa',
        timestamp: new Date(),
        type: 'error'
      }
    }

    const diagnostics = await gptDevVivo.getDiagnostics()

    return {
      id: `diagnostics_${Date.now()}`,
      content: `📊 **Diagnóstico do Sistema**\n\n` +
        `📍 **Rota Atual:**\n` +
        `- ${diagnostics.currentRoute}\n\n` +
        `🔧 **Componente:**\n` +
        `- ${diagnostics.currentComponent || 'Não identificado'}\n\n` +
        `⚠️ **Erros Recentes:**\n` +
        `${diagnostics.recentErrors.length > 0 
          ? diagnostics.recentErrors.map(e => `- ${e.message}`).join('\n')
          : '- Nenhum erro recente ✅'}\n\n` +
        `⚠️ **Warnings:**\n` +
        `${diagnostics.recentWarnings.length > 0
          ? diagnostics.recentWarnings.map(w => `- ${w.message}`).join('\n')
          : '- Nenhum warning ✅'}\n\n` +
        `🔌 **Conexões:**\n` +
        `- Supabase: ${diagnostics.supabaseConnections.length} conexões\n` +
        `- API Calls: ${diagnostics.apiCalls.length} chamadas recentes\n` +
        `- Realtime: ${diagnostics.realtimeSubscriptions.length} assinaturas\n\n` +
        `⚡ **Performance:**\n` +
        `${diagnostics.renderTime ? `- Render: ${diagnostics.renderTime}ms\n` : ''}` +
        `${diagnostics.memoryUsage ? `- Memória: ${(diagnostics.memoryUsage / 1024 / 1024).toFixed(2)} MB\n` : ''}` +
        `${diagnostics.networkLatency ? `- Latência: ${diagnostics.networkLatency}ms` : ''}`,
      confidence: 1,
      reasoning: 'Diagnóstico coletado com sucesso',
      timestamp: new Date(),
      type: 'text',
      metadata: diagnostics
    }
  } catch (error: any) {
    return {
      id: `error_${Date.now()}`,
      content: `❌ **Erro ao obter diagnóstico:**\n\n${error.message}`,
      confidence: 1,
      reasoning: error.message,
      timestamp: new Date(),
      type: 'error'
    }
  }
}

/**
 * Reverte última mudança
 */
async function handleRollback(message: string, userId: string): Promise<AIResponse> {
  try {
    if (!gptDevVivo.isActive()) {
      return {
        id: `error_${Date.now()}`,
        content: '❌ Modo Dev Vivo não está ativo. Use "ativar dev vivo" primeiro.',
        confidence: 1,
        reasoning: 'Sessão não ativa',
        timestamp: new Date(),
        type: 'error'
      }
    }

    // Buscar última mudança
    const history = await gptDevVivo.getChangeHistory(1)
    
    if (history.length === 0) {
      return {
        id: `info_${Date.now()}`,
        content: 'ℹ️ Nenhuma mudança encontrada para reverter.',
        confidence: 1,
        reasoning: 'Histórico vazio',
        timestamp: new Date(),
        type: 'text'
      }
    }

    const lastChange = history[0]
    
    // Reverter
    const success = await gptDevVivo.rollback(
      lastChange.id,
      'Rollback solicitado via comando natural'
    )

    if (success) {
      return {
        id: `rollback_${Date.now()}`,
        content: `⏪ **Mudança revertida com sucesso!**\n\n` +
          `📋 **Detalhes:**\n` +
          `- ID: ${lastChange.id}\n` +
          `- Arquivo: ${lastChange.filePath}\n` +
          `- Tipo: ${lastChange.changeType}\n` +
          `- Data: ${lastChange.createdAt.toLocaleString('pt-BR')}\n\n` +
          `✅ A mudança foi marcada como revertida no sistema.`,
        confidence: 1,
        reasoning: 'Rollback executado com sucesso',
        timestamp: new Date(),
        type: 'text',
        metadata: { changeId: lastChange.id }
      }
    } else {
      return {
        id: `error_${Date.now()}`,
        content: '❌ Erro ao reverter mudança. Verifique os logs para mais detalhes.',
        confidence: 1,
        reasoning: 'Rollback falhou',
        timestamp: new Date(),
        type: 'error'
      }
    }
  } catch (error: any) {
    return {
      id: `error_${Date.now()}`,
      content: `❌ **Erro ao reverter mudança:**\n\n${error.message}`,
      confidence: 1,
      reasoning: error.message,
      timestamp: new Date(),
      type: 'error'
    }
  }
}

/**
 * Mostra histórico de mudanças
 */
async function handleHistory(userId: string): Promise<AIResponse> {
  try {
    if (!gptDevVivo.isActive()) {
      return {
        id: `error_${Date.now()}`,
        content: '❌ Modo Dev Vivo não está ativo. Use "ativar dev vivo" primeiro.',
        confidence: 1,
        reasoning: 'Sessão não ativa',
        timestamp: new Date(),
        type: 'error'
      }
    }

    const history = await gptDevVivo.getChangeHistory(10)

    if (history.length === 0) {
      return {
        id: `info_${Date.now()}`,
        content: 'ℹ️ Nenhuma mudança registrada ainda.',
        confidence: 1,
        reasoning: 'Histórico vazio',
        timestamp: new Date(),
        type: 'text'
      }
    }

    const historyText = history.map((change, index) => {
      const statusEmoji = change.status === 'applied' ? '✅' : 
                         change.status === 'rolled_back' ? '⏪' : 
                         change.status === 'failed' ? '❌' : '⏳'
      
      return `${index + 1}. ${statusEmoji} **${change.filePath}**\n` +
        `   - Tipo: ${change.changeType}\n` +
        `   - Status: ${change.status}\n` +
        `   - Data: ${change.createdAt.toLocaleString('pt-BR')}\n` +
        `${change.reason ? `   - Motivo: ${change.reason}\n` : ''}`
    }).join('\n')

    return {
      id: `history_${Date.now()}`,
      content: `📜 **Histórico de Mudanças** (últimas ${history.length})\n\n${historyText}`,
      confidence: 1,
      reasoning: 'Histórico obtido com sucesso',
      timestamp: new Date(),
      type: 'text',
      metadata: { changes: history }
    }
  } catch (error: any) {
    return {
      id: `error_${Date.now()}`,
      content: `❌ **Erro ao obter histórico:**\n\n${error.message}`,
      confidence: 1,
      reasoning: error.message,
      timestamp: new Date(),
      type: 'error'
    }
  }
}

/**
 * Desativa o Modo Dev Vivo
 */
async function handleDeactivation(userId: string): Promise<AIResponse> {
  try {
    if (!gptDevVivo.isActive()) {
      return {
        id: `info_${Date.now()}`,
        content: 'ℹ️ Modo Dev Vivo já está desativado.',
        confidence: 1,
        reasoning: 'Sessão já inativa',
        timestamp: new Date(),
        type: 'text'
      }
    }

    await gptDevVivo.deactivate()

    return {
      id: `deactivation_${Date.now()}`,
      content: `✅ **Modo Dev Vivo desativado com sucesso!**\n\n` +
        `A sessão foi encerrada e todas as alterações foram registradas.`,
      confidence: 1,
      reasoning: 'Modo Dev Vivo desativado',
      timestamp: new Date(),
      type: 'text'
    }
  } catch (error: any) {
    return {
      id: `error_${Date.now()}`,
      content: `❌ **Erro ao desativar Modo Dev Vivo:**\n\n${error.message}`,
      confidence: 1,
      reasoning: error.message,
      timestamp: new Date(),
      type: 'error'
    }
  }
}

