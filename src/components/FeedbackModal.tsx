/**
 * FeedbackModal — V1.9.486 (Pedro 28/05/2026)
 * Modal de envio de feedback aberto (dúvida / sugestão / problema / elogio)
 * com escalação opcional pra suporte urgente via email.
 *
 * Acionado pelo botão "Feedback" no sidebar (paciente / pro / aluno / admin).
 *
 * Princípios:
 *  - polir-não-inventar: reusa useFeedback hook + Lucide icons
 *  - Anti-overclaim: SLA realista (24-48h normal, 1-2h urgente)
 *  - Responsivo mobile (V1.9.485 lições aplicadas)
 *  - LGPD: sem PHI estruturada, livre escrita
 */
import React, { useState } from 'react'
import { X, MessageSquare, Send, AlertTriangle, Check, HelpCircle, Lightbulb, Bug, Heart } from 'lucide-react'
import { useFeedback, type FeedbackCategory } from '../hooks/useFeedback'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  userRole: string
}

const CATEGORY_OPTIONS: Array<{
  value: FeedbackCategory
  label: string
  description: string
  icon: React.ReactNode
}> = [
  {
    value: 'duvida',
    label: 'Dúvida',
    description: 'Não sei como usar algo',
    icon: <HelpCircle className="w-4 h-4 text-blue-400" />,
  },
  {
    value: 'sugestao',
    label: 'Sugestão',
    description: 'Tenho uma ideia de melhoria',
    icon: <Lightbulb className="w-4 h-4 text-amber-400" />,
  },
  {
    value: 'problema',
    label: 'Problema',
    description: 'Algo não está funcionando',
    icon: <Bug className="w-4 h-4 text-red-400" />,
  },
  {
    value: 'elogio',
    label: 'Elogio',
    description: 'Algo que gostei muito',
    icon: <Heart className="w-4 h-4 text-pink-400" />,
  },
]

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userRole }) => {
  const { submitting, error, submitFeedback } = useFeedback()
  const [category, setCategory] = useState<FeedbackCategory>('duvida')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const resetAndClose = () => {
    setCategory('duvida')
    setSubject('')
    setMessage('')
    setIsUrgent(false)
    setSuccess(false)
    onClose()
  }

  const canSubmit =
    !submitting && subject.trim().length >= 3 && message.trim().length >= 10

  const handleSubmit = async () => {
    if (!canSubmit) return
    const id = await submitFeedback(
      {
        category,
        subject: subject.trim(),
        message: message.trim(),
        is_urgent: isUrgent,
      },
      userRole,
    )
    if (id) {
      setSuccess(true)
      // Auto-close depois de 3.5s
      setTimeout(resetAndClose, 3500)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4"
      onClick={!submitting ? resetAndClose : undefined}
    >
      <div
        className="relative w-full max-w-lg sm:max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 border-b border-emerald-500/20 bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30 flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-white truncate">Feedback</h2>
              <p className="text-[10px] sm:text-xs text-emerald-300/70 mt-0.5 truncate">
                Dúvidas · sugestões · problemas · elogios
              </p>
            </div>
          </div>
          <button
            onClick={resetAndClose}
            disabled={submitting}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-3">
            <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/30">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">Feedback enviado!</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm">
              {isUrgent ? (
                <>
                  Marcamos como <strong className="text-amber-300">urgente</strong>. O suporte
                  foi notificado por email. Resposta esperada em 1-2 horas.
                </>
              ) : (
                <>Sua mensagem foi registrada. Resposta esperada em 24-48 horas.</>
              )}
            </p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5">
            {/* Categoria — V1.9.486-A: 4 colunas no desktop (mais ar) / 2 mobile */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-2">
                Categoria
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    disabled={submitting}
                    className={`flex items-start gap-2 p-2.5 rounded-lg border text-left transition-colors disabled:opacity-50 ${
                      category === opt.value
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{opt.icon}</div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-medium">{opt.label}</div>
                      <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-tight">
                        {opt.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Assunto <span className="text-slate-500">(mínimo 3 caracteres)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 200))}
                disabled={submitting}
                maxLength={200}
                placeholder="Resumo curto do que você quer compartilhar"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                autoFocus
              />
              <div className="text-[10px] text-slate-600 mt-0.5 text-right">{subject.length}/200</div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1">
                Mensagem <span className="text-slate-500">(mínimo 10 caracteres)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
                disabled={submitting}
                maxLength={4000}
                rows={6}
                placeholder="Descreva com detalhes. Quanto mais contexto, mais rápido conseguimos te responder."
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 resize-none"
              />
              <div className="text-[10px] text-slate-600 mt-0.5 text-right">{message.length}/4000</div>
            </div>

            {/* Urgente */}
            <label
              className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                isUrgent
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/60'
              } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
                disabled={submitting}
                className="mt-0.5 w-4 h-4 accent-amber-500 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className={`text-xs sm:text-sm font-medium ${isUrgent ? 'text-amber-200' : 'text-slate-300'}`}>
                    Urgente (resposta em 1-2 horas)
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Marque apenas se for realmente urgente. Notifica suporte por email imediatamente.
                  Feedback normal tem retorno em 24-48 horas.
                </p>
              </div>
            </label>

            {/* Error */}
            {error && (
              <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-xs sm:text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar feedback
                  </>
                )}
              </button>
              <button
                onClick={resetAndClose}
                disabled={submitting}
                className="px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
