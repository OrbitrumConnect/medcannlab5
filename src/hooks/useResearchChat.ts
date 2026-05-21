/**
 * useResearchChat — hook isolado pra Chat Pesquisa (Nôa Matrix).
 *
 * V1.9.379-C — Frontend hook minimalista. Stateless no servidor (bypassFSM=true),
 * stateful no client (lembra mensagens da sessão atual).
 *
 * V1.9.388-A.1 — REMOVIDA chamada via NoaResidentAI.processMessage(). Causa raiz
 * de drift inferencial confirmada empíricamente (logs 19/05 ~20h25 BRT):
 *  - Intent classifier marcava "ADMINISTRATIVA → REPORT_GENERATE" pré-Edge
 *  - Platform actions tentavam generateAIReport (bloqueado por V1.9.376-C mas executava)
 *  - RAG Local duplicava knowledgeBlock do Edge (V1.9.388-A)
 *  - Assistant API adicionava camada extra
 *  - conversationHistory carregado "sem filtro de sessão" → envenenamento por
 *    turnos antigos de OUTROS chats do mesmo userId (Esperança clínica, AEC,
 *    admin) com tiques GPT (### bold "Vamos analisar"), modelo imitava history
 *    em vez de seguir RESEARCH_PROMPT V1.9.387
 *
 * Solução V1.9.388-A.1: chamada direta supabase.functions.invoke('tradevision-core').
 * Pipeline NoaResidentAI inteira pulada — só Matrix afetado (NoaResidentAI segue
 * intocado nos outros chats: Esperança paciente/médico, AEC, Admin, Teaching).
 *
 * Diferenças críticas vs useMedCannLabConversation:
 *  - NÃO conduz fluxo AEC (FSM não disparada — backend skip via bypassFSM)
 *  - NÃO persiste em aec_assessment_state (Nôa Matrix é stateless server-side)
 *  - NÃO faz síntese de voz (chat texto puro)
 *  - NÃO gera clinical_report nem racionalidades (Z2 estrutural só)
 *  - NÃO usa NoaResidentAI.processMessage (V1.9.388-A.1 — bypass total pipeline)
 *  - DETECTA Failsafe response (quality gate B.8) e mostra msg amigável
 *
 * Memórias correlatas:
 *  - project_ricardo_19_05_forum_validation_features_solicitadas (Z2 checklist)
 *  - feedback_state_pollution_noa_core_reutilizado_19_05 (bypassFSM design)
 *  - feedback_limitar_autoridade_computacional_19_05 (Z2/Z3/Z4)
 */
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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
  /** V1.9.393 (F3 reabrir dossiê) — carrega o snapshot de conversa de um dossiê salvo. */
  loadSession: (msgs: ResearchChatMessage[]) => void
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
  // V1.9.388-A.4 — Ref do último attachedContext ENVIADO ao Edge. Usado pra
  // não re-injetar [CONTEXTO MARCADO PELO MÉDICO] em turnos puramente
  // conversacionais. Bug empírico (Pedro 19/05 ~22h BRT via logs Edge):
  // toda mensagem reinjeta o corpus completo → modelo full obedece "analise
  // o corpus" porque o material está literalmente na mensagem atual →
  // re-estrutura tudo em loop em vez de progredir conversação.
  //
  // Estratégia: só injetar [CONTEXTO MARCADO] quando o ctx MUDOU desde o
  // último envio. Médico marca novo card / anexa novo paper PubMed → ctx
  // muda → re-injeta. Pergunta puramente conversacional ("o que você acha?",
  // "explica de novo isso") → ctx igual → não re-injeta → modelo lê só a
  // pergunta + history → CONVERSA referenciando o que ela mesma disse antes.
  const lastSentContextRef = useRef<string>('')

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
      // V1.9.388-A.1 — Chamada DIRETA ao Edge tradevision-core (pula NoaResidentAI
      // pipeline). Detalhes em comentário do header. Body mínimo necessário pro
      // Edge selecionar RESEARCH_PROMPT (V1.9.387) e gpt-4o-mini.
      //
      // Backend (tradevision-core) detecta isResearchMode via ui_context e:
      //  - skip FSM AEC load
      //  - skip Phase Lock injection
      //  - usa RESEARCH_PROMPT V1.9.385+387+388-A (~5k chars Z2)
      //  - força gpt-4o-mini (17× mais barato)
      //  - injeta ACERVO BASE DE CONHECIMENTO com label "Doc #A1" rastreável
      //  - simbologia '🧬 Nôa Matrix' nos logs metadata

      // V1.9.388-A.4 — Só injeta [CONTEXTO MARCADO] quando o ctx MUDOU desde
      // o último envio. Permite turnos conversacionais ("o que você acha?")
      // não recarregarem todo o corpus, evitando re-estruturação em loop.
      // Se médico marca/desmarca card ou anexa paper PubMed novo → ctx muda
      // → string diferente → re-injeta com prefixo de atualização.
      const ctx = (attachedContext || '').trim()
      const isFirstTurn = messages.length === 0
      const ctxChanged = ctx !== lastSentContextRef.current
      let fullInput: string
      if (ctx && (isFirstTurn || ctxChanged)) {
        const headerLabel = isFirstTurn
          ? '[CONTEXTO MARCADO PELO MÉDICO]'
          : '[CONTEXTO ATUALIZADO PELO MÉDICO — material foi alterado desde a última pergunta]'
        fullInput = `${headerLabel}\n${ctx}\n\n[PERGUNTA DO MÉDICO]\n${text.trim()}`
      } else {
        fullInput = text.trim()
      }
      lastSentContextRef.current = ctx

      // History LOCAL apenas (só mensagens deste chat Matrix nesta sessão).
      // Importante: zero contaminação cross-chat (Esperança, AEC, Admin).
      // Mapeia formato esperado pelo Edge: role 'user' ou 'assistant'.
      const localHistory = messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

      // Role real do user via AuthContext (não hardcoded). user.type vem de
      // AuthContext que normaliza via RPC get_my_primary_role (FONTE ÚNICA).
      const userType = (user as any)?.type || 'profissional'

      const payload = {
        message: fullInput,
        conversationHistory: localHistory,
        ui_context: { bypassFSM: true, source: 'research_chat' },
        patientData: {
          user: {
            id: user.id,
            type: userType,
            user_type: userType,
            email: user.email || undefined,
          },
          intent: 'ADMIN',
          userEmail: user.email || undefined,
        },
      }

      const { data, error } = await supabase.functions.invoke('tradevision-core', {
        body: payload,
      })

      if (error) throw error
      if ((data as any)?.error) throw new Error((data as any).error)
      const responseText = (data as any)?.text
      if (!responseText) throw new Error('Resposta da Nôa Matrix veio vazia.')

      const model = (data as any)?.metadata?.model
      const tokensUsed = (data as any)?.metadata?.tokensUsed
      const isFailsafe = isFailsafeResponse(model, tokensUsed)

      const matrixMessage: ResearchChatMessage = {
        id: `matrix-${Date.now()}`,
        role: 'noa-matrix',
        content: isFailsafe
          ? '⚠️ Nôa Matrix indisponível no momento — o motor cognitivo retornou em modo determinístico. Tente novamente em alguns minutos. Sua pergunta NÃO foi processada estruturalmente.'
          : responseText,
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
    // V1.9.393 — `messages` incluído nas deps: necessário pra que sendMessage
    // enxergue o snapshot restaurado por loadSession (F3 "Continuar pesquisa").
    // Sem isso, o closure ficava preso às mensagens de antes da restauração e
    // o localHistory enviado ao Edge não incluía a conversa do dossiê.
  }, [user, isProcessing, messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setErrorMessage(null)
    // V1.9.388-A.4 — Reset do ref pra próxima sessão limpa
    lastSentContextRef.current = ''
  }, [])

  // V1.9.393 (F3 reabrir dossiê) — Restaura a conversa de um dossiê salvo na
  // sessão atual. Substitui as mensagens pelo snapshot imutável. Reseta o ref
  // de contexto: a sessão derivada recomeça "limpa" do ponto de vista de
  // re-injeção de corpus (médico re-marca cards se quiser). O dossiê de origem
  // NUNCA é alterado — saveDossier sempre faz INSERT, então "Continuar pesquisa"
  // que termine em novo "Fechar como dossiê" cria outra row, não muta a original.
  const loadSession = useCallback((msgs: ResearchChatMessage[]) => {
    setMessages(msgs)
    setErrorMessage(null)
    lastSentContextRef.current = ''
  }, [])

  return {
    messages,
    isProcessing,
    sendMessage,
    clearChat,
    loadSession,
    errorMessage,
  }
}
