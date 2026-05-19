/**
 * useResearchChat — hook isolado pra Chat Pesquisa (Nôa Matrix).
 *
 * V1.9.379-C — Frontend hook minimalista. Stateless no servidor (bypassFSM=true),
 * stateful no client (lembra mensagens da sessão atual).
 *
 * Diferenças críticas vs useMedCannLabConversation:
 *  - NÃO conduz fluxo AEC (FSM não disparada — backend skip via bypassFSM)
 *  - NÃO persiste em aec_assessment_state (Nôa Matrix é stateless server-side)
 *  - NÃO faz síntese de voz (chat texto puro)
 *  - NÃO gera clinical_report nem racionalidades (Z2 estrutural só)
 *  - DETECTA Failsafe response (quality gate B.8) e mostra msg amigável
 *
 * Memórias correlatas:
 *  - project_ricardo_19_05_forum_validation_features_solicitadas (Z2 checklist)
 *  - feedback_state_pollution_noa_core_reutilizado_19_05 (bypassFSM design)
 *  - feedback_limitar_autoridade_computacional_19_05 (Z2/Z3/Z4)
 */
import { useCallback, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { NoaResidentAI } from '../lib/noaResidentAI'

export interface ResearchChatMessage {
  id: string
  role: 'user' | 'noa-matrix'
  content: string
  timestamp: Date
  isFailsafe?: boolean  // V1.9.379-C quality gate: GPT down → não confiar no conteúdo
  model?: string         // Pra observabilidade (gpt-4o-mini esperado)
}

export interface UseResearchChatReturn {
  messages: ResearchChatMessage[]
  isProcessing: boolean
  sendMessage: (text: string, attachedContext?: string) => Promise<void>
  clearChat: () => void
  errorMessage: string | null
}

// V1.9.379-C — Detectar resposta Failsafe (Sovereignty Protocol v2 ativou — GPT down).
// Pattern reusado de V1.9.376-D rationalityAnalysisService quality gate.
function isFailsafeResponse(model?: string, tokensUsed?: number): boolean {
  if (!model) return false
  const m = model.toLowerCase()
  if (m.includes('deterministic') || m.includes('failsafe')) return true
  if (typeof tokensUsed === 'number' && tokensUsed === 0 && !m.includes('verbatim')) return true
  return false
}

export function useResearchChat(): UseResearchChatReturn {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ResearchChatMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sendMessage = useCallback(async (text: string, attachedContext?: string) => {
    if (!text.trim() || isProcessing) return
    if (!user?.id) {
      setErrorMessage('Sessão de usuário não detectada. Faça login novamente.')
      return
    }

    const userMessage: ResearchChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // V1.9.379-A/B — Chama Core via processMessage com bypassFSM=true.
      // Backend (tradevision-core) detecta isResearchMode e:
      //  - skip FSM AEC load
      //  - skip Phase Lock injection
      //  - usa RESEARCH_PROMPT (~3k chars Z2)
      //  - força gpt-4o-mini (17× mais barato)
      //  - simbologia '🧬 Nôa Matrix' nos logs metadata
      const noa = new NoaResidentAI()

      // Compor input com contexto anexado (Casos Similares + Literatura + notas marcadas pelo médico).
      // V1.9.379-D vai adicionar UX pra anexar contexto via cards selecionados.
      const fullInput = attachedContext && attachedContext.trim()
        ? `[CONTEXTO MARCADO PELO MÉDICO]\n${attachedContext.trim()}\n\n[PERGUNTA DO MÉDICO]\n${text.trim()}`
        : text.trim()

      const response = await noa.processMessage(
        fullInput,
        user.id,
        user.email || undefined,
        { bypassFSM: true, source: 'research_chat' }  // V1.9.379-A flag crítico
      )

      const model = (response as any)?.metadata?.model
      const tokensUsed = (response as any)?.metadata?.tokensUsed
      const isFailsafe = isFailsafeResponse(model, tokensUsed)

      const matrixMessage: ResearchChatMessage = {
        id: `matrix-${Date.now()}`,
        role: 'noa-matrix',
        content: isFailsafe
          ? '⚠️ Nôa Matrix indisponível no momento — o motor cognitivo retornou em modo determinístico. Tente novamente em alguns minutos. Sua pergunta NÃO foi processada estruturalmente.'
          : response.content,
        timestamp: new Date(),
        isFailsafe,
        model,
      }
      setMessages((prev) => [...prev, matrixMessage])
    } catch (err: any) {
      console.error('[useResearchChat] Erro processando mensagem:', err)
      setErrorMessage(err?.message || 'Erro ao processar pergunta — tente novamente.')
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'noa-matrix',
          content: '⚠️ Não consegui processar sua pergunta no momento. Tente novamente em instantes.',
          timestamp: new Date(),
          isFailsafe: true,
        },
      ])
    } finally {
      setIsProcessing(false)
    }
  }, [user, isProcessing])

  const clearChat = useCallback(() => {
    setMessages([])
    setErrorMessage(null)
  }, [])

  return {
    messages,
    isProcessing,
    sendMessage,
    clearChat,
    errorMessage,
  }
}
