/**
 * ResearchChat — componente UI dedicado pra Chat Pesquisa (Nôa Matrix).
 *
 * V1.9.379-C — UI minimalista, isolada de NoaConversationalInterface
 * (evita confusão UX entre Nôa Esperanza chat clínico e Nôa Matrix chat pesquisa).
 *
 * Design Z2 (estruturador, não-diretivo):
 *  - Sem ícones que sugiram autoridade clínica
 *  - Aviso permanente no rodapé sobre escopo Z2
 *  - Quality gate Failsafe visualmente distinto (mensagem amarela em caso de GPT down)
 *  - Atrito intencional UX pra "marcar pra dossiê fórum" (placeholder V1.9.379-D)
 *
 * Tons do app (sem arco-íris, princípio cristalizado feedback_clinical_cockpit_cor_por_estado):
 *  - emerald (assinatura visual MedCannLab)
 *  - slate (neutro)
 *  - amber (atenção/quality gate)
 *  - purple (Nôa Matrix — diferencia de emerald da Nôa Esperanza)
 */
import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, AlertTriangle, Sparkles, Trash2, Info } from 'lucide-react'
import { useResearchChat } from '../hooks/useResearchChat'

interface ResearchChatProps {
  /** Contexto anexado (Casos Similares + Literatura + notas marcadas). V1.9.379-D injetará via prop. */
  attachedContext?: string
  /** Callback opcional pra marcar mensagem pra dossiê do fórum (V1.9.379-D). */
  onMarkForForum?: (messageId: string, content: string) => void
}

export const ResearchChat: React.FC<ResearchChatProps> = ({ attachedContext, onMarkForForum }) => {
  const { messages, isProcessing, sendMessage, clearChat, errorMessage } = useResearchChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return
    const text = input.trim()
    setInput('')
    await sendMessage(text, attachedContext)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border border-purple-500/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-slate-900/60">
        <div className="flex items-center gap-2.5">
          {/* V1.9.383 — Avatar Nôa estático (mesmo asset usado em Header.tsx + outros chats) */}
          <img
            src="/AvatarsEstatico.png"
            alt="Nôa Matrix"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-500/40"
          />
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
              <span>🧬 Nôa Matrix</span>
              <span className="text-[10px] font-normal text-purple-300/70 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">Z2</span>
            </h3>
            <p className="text-[10px] text-slate-500 leading-tight">
              Chat estrutural · não-diretivo · organiza corpus marcado
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-1.5 rounded-md text-slate-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
            title="Limpar conversa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[500px]">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            {/* V1.9.383 — Avatar Nôa Matrix no empty state */}
            <img
              src="/AvatarsEstatico.png"
              alt="Nôa Matrix"
              className="w-16 h-16 rounded-full object-cover mx-auto mb-3 ring-2 ring-purple-500/30"
            />
            <p className="text-sm text-slate-400 mb-1.5">Nôa Matrix pronta para estruturar.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Marque casos em <strong className="text-purple-300">Casos Similares</strong> e papers em <strong className="text-purple-300">Literatura</strong>, depois traga aqui pra comparar, agrupar, citar e estruturar perguntas.
            </p>
            <p className="text-[10px] text-slate-600 mt-3 italic">
              Não sugere conduta. Não infere diagnóstico. Médico decide.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* V1.9.383 — Avatar Nôa Matrix ao lado das mensagens dela (consistência com chats paciente) */}
                {msg.role === 'noa-matrix' && (
                  <img
                    src="/AvatarsEstatico.png"
                    alt=""
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-purple-500/30 mt-0.5"
                  />
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-50'
                      : msg.isFailsafe
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100'
                        : 'bg-purple-500/10 border border-purple-500/20 text-slate-100'
                  }`}
                >
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  {msg.role === 'noa-matrix' && !msg.isFailsafe && onMarkForForum && (
                    <button
                      onClick={() => onMarkForForum(msg.id, msg.content)}
                      className="mt-2 text-[10px] text-purple-300/70 hover:text-purple-200 underline-offset-2 hover:underline"
                      title="Marcar resposta para anexar ao dossiê do fórum (V1.9.379-D)"
                    >
                      📎 Anexar ao dossiê do fórum
                    </button>
                  )}
                  {msg.isFailsafe && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-400/80">
                      <AlertTriangle className="w-3 h-3" />
                      Modo determinístico — resposta NÃO estrutural
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-start gap-2 justify-start">
                {/* V1.9.383 — Avatar Nôa Matrix durante loading (consistência) */}
                <img
                  src="/AvatarsEstatico.png"
                  alt=""
                  className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-1 ring-purple-500/30 mt-0.5"
                />
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3.5 py-2.5 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-purple-300 animate-spin" />
                  <span className="text-xs text-slate-400">Nôa Matrix estruturando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Erro */}
      {errorMessage && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/30 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-300">{errorMessage}</span>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-purple-500/20 bg-slate-900/60 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte sobre o corpus marcado... (ex: compare Caso #1 com Caso #3)"
            disabled={isProcessing}
            rows={2}
            className="flex-1 bg-slate-800/50 border border-purple-500/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            title="Enviar (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="text-xs">Enviar</span>
          </button>
        </div>

        {/* Disclaimer permanente Z2 */}
        <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-500 italic leading-tight">
          <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>
            Nôa Matrix organiza o corpus marcado. Não sugere conduta nem infere diagnóstico.
            Interpretação clínica é responsabilidade do médico.
          </span>
        </div>
      </div>
    </div>
  )
}
