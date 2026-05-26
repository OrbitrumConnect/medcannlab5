import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, ClipboardCheck, MessageCircle, Check, ArrowRight, Sparkles } from 'lucide-react'

/**
 * ChatModeSelector — V1.9.442 (24/05/2026)
 *
 * Card contextual que aparece QUANDO usuario clica "Iniciar Avaliação" no
 * PatientDashboard. Calibra expectativa ANTES de iniciar AEC, oferecendo
 * 2 caminhos com paridade visual:
 *
 *   1. AEC (estruturada) — gera relatorio ICP, paciente e OUVIDO
 *   2. Chat Livre — conversa aberta, sem coleta, sem relatorio
 *
 * Origem: descoberta empirica 23-24/05 — Illa Proença (agronoma, presidente
 * associacao) abandonou em 3min porque caiu na AEC esperando chat livre.
 * Prima dentista forcou semantica em caso eletivo. Faveret abandonou apos
 * 3 AECs. Padrao confirmado: 89,8% das interacoes IA do app sao chat livre
 * conversacional, 2% sao AEC formal (memoria feedback_chat_livre_dominante
 * _vs_aec_minoria_24_05).
 *
 * Principio aplicado: nao mudar AEC (memoria feedback_aec_como_repelente
 * _natural). Calibrar entrada com transparencia. Persistir "nao mostrar
 * novamente" pra respeitar usuario experiente.
 *
 * Renderizado via React Portal (escapa qualquer stacking context) na raiz
 * do document.body — padrão usado em V1.9.440-A (QuickReferralModal,
 * dropdown Novo Paciente).
 */

const LS_KEY = 'chat_mode_selector_seen_v1_9_442'

export interface ChatModeSelectorProps {
  open: boolean
  onClose: () => void
  onChooseAEC: () => void
  onChooseFreeChat: () => void
}

export const ChatModeSelector: React.FC<ChatModeSelectorProps> = ({
  open,
  onClose,
  onChooseAEC,
  onChooseFreeChat,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Reset checkbox quando modal abre
  useEffect(() => {
    if (open) setDontShowAgain(false)
  }, [open])

  if (!open) return null

  const persistDismissIfRequested = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(LS_KEY, new Date().toISOString())
      } catch {
        // Ignore quota errors — falha silenciosa, usuario vê de novo da próxima
      }
    }
  }

  const handleChooseAEC = () => {
    persistDismissIfRequested()
    onChooseAEC()
  }

  const handleChooseFreeChat = () => {
    persistDismissIfRequested()
    onChooseFreeChat()
  }

  const handleClose = () => {
    persistDismissIfRequested()
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border rounded-2xl shadow-2xl overflow-hidden"
        style={{
          borderColor: 'rgba(0, 229, 178, 0.25)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0, 229, 178, 0.18)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header com glow sutil */}
        <div
          className="px-6 py-4 flex items-start justify-between"
          style={{
            background:
              'linear-gradient(135deg, rgba(0, 229, 178, 0.08) 0%, rgba(79, 224, 193, 0.05) 100%)',
            borderBottom: '1px solid rgba(0, 229, 178, 0.15)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(0, 229, 178, 0.12)',
                border: '1px solid rgba(0, 229, 178, 0.3)',
                boxShadow: '0 0 20px rgba(0, 229, 178, 0.15)',
              }}
            >
              <Sparkles className="w-5 h-5 text-[#00E5B2]" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-white">
                Como você quer interagir com a Nôa agora?
              </h2>
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                Dois caminhos · você escolhe
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo — 2 cards lado a lado (md+) ou empilhados (sm) */}
        <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">

          {/* Card AEC */}
          <button
            type="button"
            onClick={handleChooseAEC}
            className="text-left rounded-xl p-4 md:p-5 transition-all hover:scale-[1.015] hover:shadow-lg group flex flex-col"
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 200, 83, 0.06) 0%, rgba(0, 200, 83, 0.02) 100%)',
              border: '1px solid rgba(0, 200, 83, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 200, 83, 0.55)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 200, 83, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 200, 83, 0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(0, 200, 83, 0.15)',
                  border: '1px solid rgba(0, 200, 83, 0.35)',
                }}
              >
                <ClipboardCheck className="w-4.5 h-4.5 text-[#00C853]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#00C853] font-mono font-semibold">
                  Estruturada · Clínica
                </div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Avaliação Clínica (AEC)
                </h3>
              </div>
            </div>

            <p className="text-[12px] text-slate-300 leading-relaxed mb-3">
              A Nôa vai te <strong className="text-[#00E5B2]">ouvir em sequência</strong>.
              Você responde, ela organiza. Resultado: relatório clínico oficial
              pra seu médico revisar.
            </p>

            <ul className="space-y-1 text-[11px] text-slate-300 leading-relaxed mb-4 flex-1">
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#00C853] mt-0.5 flex-shrink-0" />
                <span>Você é <strong>ouvido</strong> (não pergunta livremente)</span>
              </li>
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#00C853] mt-0.5 flex-shrink-0" />
                <span>Segue um plano clínico de ~15-20 minutos</span>
              </li>
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#00C853] mt-0.5 flex-shrink-0" />
                <span>Gera <strong>relatório oficial</strong> assinado (ICP-Brasil)</span>
              </li>
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#00C853] mt-0.5 flex-shrink-0" />
                <span>Ideal pra: primeira consulta, retorno longitudinal</span>
              </li>
            </ul>

            <div
              className="mt-auto inline-flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all group-hover:translate-x-0.5 group-hover:bg-[rgba(0,200,83,0.18)]"
              style={{
                background: 'rgba(0, 200, 83, 0.10)',
                border: '1px solid rgba(0, 200, 83, 0.45)',
                color: '#00E5B2',
                boxShadow: 'inset 0 0 16px rgba(0, 200, 83, 0.06)',
              }}
            >
              <span>Iniciar Avaliação agora</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Card Chat Livre */}
          <button
            type="button"
            onClick={handleChooseFreeChat}
            className="text-left rounded-xl p-4 md:p-5 transition-all hover:scale-[1.015] hover:shadow-lg group flex flex-col"
            style={{
              background:
                'linear-gradient(135deg, rgba(79, 224, 193, 0.06) 0%, rgba(79, 224, 193, 0.02) 100%)',
              border: '1px solid rgba(79, 224, 193, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(79, 224, 193, 0.55)'
              e.currentTarget.style.boxShadow = '0 0 30px rgba(79, 224, 193, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(79, 224, 193, 0.3)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(79, 224, 193, 0.15)',
                  border: '1px solid rgba(79, 224, 193, 0.35)',
                }}
              >
                <MessageCircle className="w-4.5 h-4.5 text-[#4FE0C1]" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-[0.2em] text-[#4FE0C1] font-mono font-semibold">
                  Aberto · Conversacional
                </div>
                <h3 className="text-sm font-bold text-white leading-tight">
                  Chat Livre com a Nôa
                </h3>
              </div>
            </div>

            <p className="text-[12px] text-slate-300 leading-relaxed mb-3">
              Conversa <strong className="text-[#4FE0C1]">aberta</strong>.
              Você pergunta, ela responde sobre cannabis, plataforma,
              agendamentos, dúvidas em geral.
            </p>

            <ul className="space-y-1 text-[11px] text-slate-300 leading-relaxed mb-4 flex-1">
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#4FE0C1] mt-0.5 flex-shrink-0" />
                <span>Você <strong>pergunta</strong> livremente</span>
              </li>
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#4FE0C1] mt-0.5 flex-shrink-0" />
                <span>Sem coleta estruturada de dados clínicos</span>
              </li>
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#4FE0C1] mt-0.5 flex-shrink-0" />
                <span><strong>Não gera</strong> relatório oficial</span>
              </li>
              <li className="flex gap-1.5">
                <Check className="w-3 h-3 text-[#4FE0C1] mt-0.5 flex-shrink-0" />
                <span>Ideal pra: tirar dúvidas, navegar, conversar</span>
              </li>
            </ul>

            <div
              className="mt-auto inline-flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all group-hover:translate-x-0.5 group-hover:bg-[rgba(79,224,193,0.16)]"
              style={{
                background: 'rgba(79, 224, 193, 0.08)',
                border: '1px solid rgba(79, 224, 193, 0.45)',
                color: '#7FF2D6',
                boxShadow: 'inset 0 0 16px rgba(79, 224, 193, 0.05)',
              }}
            >
              <span>Conversar com a Nôa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 flex items-center justify-between gap-3"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
            borderTop: '1px solid rgba(51, 65, 85, 0.5)',
          }}
        >
          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer select-none hover:text-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-[#00E5B2] focus:ring-1 focus:ring-[#00E5B2] focus:ring-offset-0 cursor-pointer"
            />
            <span>Não mostrar novamente (já entendi a diferença)</span>
          </label>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider hidden sm:inline">
            Você pode trocar a qualquer momento
          </span>
        </div>
      </div>
    </div>,
    document.body
  )
}

/**
 * Helper: verifica se o usuário já dispensou o seletor permanentemente.
 * Retorna true se já viu (não mostrar novamente).
 */
export function hasUserDismissedChatModeSelector(): boolean {
  try {
    return !!localStorage.getItem(LS_KEY)
  } catch {
    return false
  }
}
