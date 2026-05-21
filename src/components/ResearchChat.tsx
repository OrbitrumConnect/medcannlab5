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
import { Send, Loader2, AlertTriangle, Sparkles, Trash2, Info, FileText, Eye, GitBranch } from 'lucide-react'
import { useResearchChat } from '../hooks/useResearchChat'
import type { DossierMessage } from '../lib/dossierExport'

interface ResearchChatProps {
  /** Contexto anexado (Casos Similares + Literatura + notas marcadas). V1.9.379-D injetará via prop. */
  attachedContext?: string
  /** Callback opcional pra marcar mensagem pra dossiê do fórum (V1.9.379-D). */
  onMarkForForum?: (messageId: string, content: string) => void
  /** V1.9.390 (F3-A.1) — callback "Fechar como dossiê". NoaMatrixView recebe messages
   *  e combina com cards+papers estruturados pra gerar PDF via window.print(). */
  onCloseDossier?: (messages: DossierMessage[]) => void
  /** V1.9.393 (F3 reabrir dossiê) — pedido de restauração de um dossiê salvo.
   *  token muda a cada clique → permite reabrir o mesmo dossiê 2×.
   *  mode 'review' = só-leitura (snapshot imutável); 'continue' = sessão derivada editável. */
  restoreRequest?: {
    token: number
    title: string
    messages: DossierMessage[]
    mode: 'review' | 'continue'
  } | null
}

export const ResearchChat: React.FC<ResearchChatProps> = ({ attachedContext, onMarkForForum, onCloseDossier, restoreRequest }) => {
  const { messages, isProcessing, sendMessage, clearChat, loadSession, errorMessage } = useResearchChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // V1.9.393 (F3 reabrir dossiê) — modo da sessão:
  //  'live'     = sessão normal de pesquisa
  //  'review'   = revisando um dossiê salvo (só-leitura, snapshot imutável)
  //  'continue' = sessão derivada de um dossiê (editável; original não é tocado)
  const [sessionMode, setSessionMode] = useState<'live' | 'review' | 'continue'>('live')
  const [restoredTitle, setRestoredTitle] = useState('')
  const lastRestoreToken = useRef(0)

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // V1.9.393 (F3 reabrir dossiê) — quando NoaMatrixView pede restauração,
  // carrega o snapshot na sessão. token muda a cada clique (reabrir 2× funciona).
  // timestamp vem do jsonb como string → normaliza pra Date.
  useEffect(() => {
    if (!restoreRequest || restoreRequest.token === lastRestoreToken.current) return
    lastRestoreToken.current = restoreRequest.token
    loadSession(
      restoreRequest.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
        isFailsafe: m.isFailsafe,
      })),
    )
    setSessionMode(restoreRequest.mode)
    setRestoredTitle(restoreRequest.title)
  }, [restoreRequest, loadSession])

  // V1.9.393 — limpar sempre volta à sessão viva (sai de review/continue)
  const handleClear = () => {
    clearChat()
    setSessionMode('live')
    setRestoredTitle('')
  }

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

  // V1.9.391 (Pedro+GPT-Pedro 20/05 ~15h BRT) — fix overflow flex Tailwind clássico.
  // Bug empírico: respostas longas Matrix ficavam cobertas pelo input/footer.
  // Causas: max-h-[500px] cortava sem respiro + pai flex sem min-h-0 + input sem shrink-0.
  // Solução: min-h-0 no pai, pb-extra no scrollable, shrink-0 no header/input.
  // Memory feedback_coerencia_e_alinhamento: análise empírica antes do código.
  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-900/40 border border-purple-500/20 rounded-xl overflow-hidden">
      {/* Header */}
      {/* V1.9.391 — header com shrink-0 (não compress pelo scrollable) */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-slate-900/60">
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
        {messages.length > 0 && sessionMode !== 'review' && (
          <div className="flex items-center gap-1.5">
            {/* V1.9.390 (F3-A.1) — Fechar como dossiê. Só aparece se callback existe E há mensagens. */}
            {onCloseDossier && (
              <button
                onClick={() => onCloseDossier(messages)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-colors"
                title="Fechar esta sessão como dossiê PDF (gera HTML estruturado + print do navegador)"
              >
                <FileText className="w-3 h-3" />
                <span>Fechar como dossiê</span>
              </button>
            )}
            <button
              onClick={handleClear}
              className="p-1.5 rounded-md text-slate-500 hover:text-purple-300 hover:bg-purple-500/10 transition-colors"
              title="Limpar conversa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* V1.9.393 (F3 reabrir dossiê) — banner sessão derivada (modo continue) */}
      {sessionMode === 'continue' && (
        <div className="shrink-0 px-4 py-2 bg-purple-500/10 border-b border-purple-500/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-purple-200 min-w-0">
            <GitBranch className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              Sessão derivada de <strong>{restoredTitle}</strong> — o dossiê original não é alterado.
            </span>
          </div>
          <button
            onClick={handleClear}
            className="flex-shrink-0 text-[10px] text-slate-400 hover:text-purple-200 underline-offset-2 hover:underline"
            title="Descartar esta sessão derivada e começar do zero"
          >
            nova sessão
          </button>
        </div>
      )}

      {/* Mensagens */}
      {/* V1.9.391 — scrollable com min-h-0 (fix bug overflow flex Tailwind)
          + pb-6 pra respiro entre última mensagem e input
          + max-h aumentado 500→650 pra acomodar respostas Matrix longas (~2000 chars) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6 space-y-3 min-h-[300px] max-h-[650px]">
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
        <div className="shrink-0 px-4 py-2 bg-red-500/10 border-t border-red-500/30 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-300">{errorMessage}</span>
        </div>
      )}

      {/* V1.9.393 (F3 reabrir dossiê) — modo revisão: input substituído por painel só-leitura */}
      {sessionMode === 'review' && (
        <div className="shrink-0 border-t border-amber-500/20 bg-slate-900/60 p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[11px] text-amber-200 min-w-0">
              <Eye className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                Revisando <strong>{restoredTitle}</strong> — snapshot imutável, somente leitura.
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => setSessionMode('continue')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-purple-500/15 text-purple-200 border border-purple-500/30 hover:bg-purple-500/25 transition-colors"
                title="Abrir uma sessão derivada editável a partir deste dossiê"
              >
                <GitBranch className="w-3 h-3" />
                <span>Continuar pesquisa</span>
              </button>
              <button
                onClick={handleClear}
                className="px-2.5 py-1.5 rounded-md text-[11px] text-slate-400 hover:text-purple-200 border border-slate-700/40 hover:border-purple-500/30 transition-colors"
                title="Sair da revisão e voltar à sessão livre"
              >
                Sair
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-start gap-1.5 text-[10px] text-slate-500 italic leading-tight">
            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>
              Dossiê é foto fixa da sessão. Para retomar a conversa, use "Continuar pesquisa" —
              uma sessão derivada que não altera o dossiê original.
            </span>
          </div>
        </div>
      )}

      {/* Input */}
      {/* V1.9.391 — shrink-0 garante que input nunca seja comprimido pelo scrollable */}
      {/* V1.9.393 — input só aparece fora do modo revisão */}
      {sessionMode !== 'review' && (
      <div className="shrink-0 border-t border-purple-500/20 bg-slate-900/60 p-3">
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
      )}
    </div>
  )
}
