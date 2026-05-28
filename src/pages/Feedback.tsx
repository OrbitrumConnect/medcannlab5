/**
 * Feedback — V1.9.486-B (Pedro 28/05/2026)
 * Página dedicada de feedback aberto (paciente / profissional / aluno).
 *
 * REVERSO de V1.9.486 (modal no sidebar) — Pedro pediu página própria:
 *  - "no sidebar confunde usuário"
 *  - "nunca tivemos isso ali"
 *  - "pode ser uma aba única"
 *
 * Estrutura: 2 tabs
 *  - Novo Feedback: form completo (categoria 4 cols / assunto / mensagem / urgente)
 *  - Meus Feedbacks: lista própria via RLS (status / resposta admin / urgência)
 *
 * Acesso: link na seção Suporte do Profile.tsx (V1.9.486-B trigger discreto)
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bug,
  Check,
  Heart,
  HelpCircle,
  Inbox,
  Lightbulb,
  Loader2,
  MessageSquare,
  Send,
  Clock,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFeedback, type FeedbackCategory, type FeedbackStatus, type FeedbackTicket } from '../hooks/useFeedback'

const CATEGORY_OPTIONS: Array<{
  value: FeedbackCategory
  label: string
  description: string
  icon: React.ReactNode
}> = [
  { value: 'duvida',   label: 'Dúvida',   description: 'Não sei como usar algo', icon: <HelpCircle className="w-4 h-4 text-blue-400" /> },
  { value: 'sugestao', label: 'Sugestão', description: 'Tenho uma ideia',         icon: <Lightbulb className="w-4 h-4 text-amber-400" /> },
  { value: 'problema', label: 'Problema', description: 'Algo não funciona',       icon: <Bug className="w-4 h-4 text-red-400" /> },
  { value: 'elogio',   label: 'Elogio',   description: 'Algo que gostei',         icon: <Heart className="w-4 h-4 text-pink-400" /> },
]

const STATUS_META: Record<FeedbackStatus, { label: string; color: string }> = {
  open:         { label: 'Aberto',       color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  in_progress:  { label: 'Em andamento', color: 'text-blue-300 bg-blue-500/10 border-blue-500/30' },
  resolved:     { label: 'Resolvido',    color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  closed:       { label: 'Fechado',      color: 'text-slate-400 bg-slate-700/30 border-slate-600/30' },
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  duvida:   { label: 'Dúvida',   icon: <HelpCircle className="w-4 h-4 text-blue-400" /> },
  sugestao: { label: 'Sugestão', icon: <Lightbulb className="w-4 h-4 text-amber-400" /> },
  problema: { label: 'Problema', icon: <Bug className="w-4 h-4 text-red-400" /> },
  elogio:   { label: 'Elogio',   icon: <Heart className="w-4 h-4 text-pink-400" /> },
}

const Feedback: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { submitting, loading, error, submitFeedback, listFeedbacks } = useFeedback()

  const userRole = (user as any)?.role || (user as any)?.user_metadata?.role || 'unknown'

  const [activeTab, setActiveTab] = useState<'novo' | 'meus'>('novo')

  // Form state
  const [category, setCategory] = useState<FeedbackCategory>('duvida')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [success, setSuccess] = useState<{ id: string; urgent: boolean } | null>(null)

  // Lista
  const [tickets, setTickets] = useState<FeedbackTicket[]>([])

  const refreshList = async () => {
    const data = await listFeedbacks(50)
    setTickets(data)
  }

  useEffect(() => {
    if (activeTab === 'meus') {
      void refreshList()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const canSubmit = !submitting && subject.trim().length >= 3 && message.trim().length >= 10

  const resetForm = () => {
    setCategory('duvida')
    setSubject('')
    setMessage('')
    setIsUrgent(false)
    setSuccess(null)
  }

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
      setSuccess({ id, urgent: isUrgent })
      // limpa form mas mantém success state
      setSubject('')
      setMessage('')
      setIsUrgent(false)
    }
  }

  const ticketsByStatus = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
      urgent_active: tickets.filter((t) => t.is_urgent && t.status !== 'resolved' && t.status !== 'closed').length,
    }
  }, [tickets])

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold truncate">Feedback / Suporte</h1>
            <p className="text-xs text-slate-400">
              Dúvidas · sugestões · problemas · elogios · resposta em 24-48h (urgente 1-2h)
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('novo')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'novo'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            Novo feedback
          </button>
          <button
            onClick={() => setActiveTab('meus')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'meus'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Meus feedbacks
            {tickets.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab: NOVO */}
        {activeTab === 'novo' && (
          <div className="space-y-5">
            {/* Success banner */}
            {success && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-start gap-3">
                <div className="p-1.5 bg-emerald-500/20 rounded-full flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-emerald-200">Feedback enviado com sucesso</p>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    {success.urgent ? (
                      <>
                        Marcado como <strong>urgente</strong>. Suporte notificado por email. Resposta em 1-2 horas.
                      </>
                    ) : (
                      <>Sua mensagem foi registrada. Resposta esperada em 24-48 horas.</>
                    )}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={resetForm}
                      className="text-xs text-emerald-300 hover:text-emerald-200 underline"
                    >
                      Enviar outro
                    </button>
                    <span className="text-emerald-500/40">·</span>
                    <button
                      onClick={() => setActiveTab('meus')}
                      className="text-xs text-emerald-300 hover:text-emerald-200 underline"
                    >
                      Ver meus feedbacks
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Categoria</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCategory(opt.value)}
                    disabled={submitting}
                    className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors disabled:opacity-50 ${
                      category === opt.value
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-100'
                        : 'bg-slate-900/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">{opt.icon}</div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">{opt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Assunto <span className="text-slate-500 text-xs">(mínimo 3 caracteres)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value.slice(0, 200))}
                disabled={submitting}
                maxLength={200}
                placeholder="Resumo curto do que você quer compartilhar"
                className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
              <div className="text-[10px] text-slate-600 mt-0.5 text-right">{subject.length}/200</div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Mensagem <span className="text-slate-500 text-xs">(mínimo 10 caracteres)</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 4000))}
                disabled={submitting}
                maxLength={4000}
                rows={8}
                placeholder="Descreva com detalhes. Quanto mais contexto, mais rápido conseguimos te responder."
                className="w-full px-3 py-2.5 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 resize-none"
              />
              <div className="text-[10px] text-slate-600 mt-0.5 text-right">{message.length}/4000</div>
            </div>

            {/* Urgente */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isUrgent
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/60'
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
                  <AlertTriangle className={`w-4 h-4 ${isUrgent ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className={`text-sm font-medium ${isUrgent ? 'text-amber-200' : 'text-slate-300'}`}>
                    Marcar como urgente (resposta em 1-2 horas)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  Notifica o suporte por email imediatamente. Use apenas se for realmente urgente.
                </p>
              </div>
            </label>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar feedback
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab: MEUS */}
        {activeTab === 'meus' && (
          <div className="space-y-3">
            {/* Resumo contadores */}
            {tickets.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50">
                  Total: <strong className="text-white">{ticketsByStatus.total}</strong>
                </span>
                {ticketsByStatus.urgent_active > 0 && (
                  <span className="px-2 py-1 rounded border text-amber-300 bg-amber-500/10 border-amber-500/30">
                    🚨 Urgentes ativos: {ticketsByStatus.urgent_active}
                  </span>
                )}
                <span className="px-2 py-1 rounded border text-amber-300 bg-amber-500/10 border-amber-500/30">
                  Abertos: {ticketsByStatus.open}
                </span>
                <span className="px-2 py-1 rounded border text-blue-300 bg-blue-500/10 border-blue-500/30">
                  Em andamento: {ticketsByStatus.in_progress}
                </span>
                <span className="px-2 py-1 rounded border text-emerald-300 bg-emerald-500/10 border-emerald-500/30">
                  Resolvidos: {ticketsByStatus.resolved}
                </span>
              </div>
            )}

            {/* Loading */}
            {loading && tickets.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Carregando seus feedbacks...
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center">
                <Inbox className="w-12 h-12 mx-auto mb-3 text-slate-700" />
                <p className="text-slate-400 text-sm">Você ainda não enviou nenhum feedback.</p>
                <button
                  onClick={() => setActiveTab('novo')}
                  className="mt-3 text-xs text-emerald-300 hover:text-emerald-200 underline"
                >
                  Enviar o primeiro
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => {
                  const cat = CATEGORY_META[ticket.category] || { label: ticket.category, icon: null }
                  const stat = STATUS_META[ticket.status]
                  return (
                    <div
                      key={ticket.id}
                      className="p-3 sm:p-4 rounded-lg bg-slate-900/40 border border-slate-700/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{cat.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{ticket.subject}</span>
                            {ticket.is_urgent && (
                              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Urgente
                              </span>
                            )}
                            <span className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border ${stat.color}`}>
                              {stat.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed whitespace-pre-wrap">
                            {ticket.message}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                            <Clock className="w-3 h-3" />
                            <span>{cat.label}</span>
                            <span>·</span>
                            <span>{new Date(ticket.created_at).toLocaleString('pt-BR')}</span>
                          </div>

                          {/* Resposta admin */}
                          {ticket.admin_response && (
                            <div className="mt-3 p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                              <p className="text-[10px] uppercase tracking-wide text-emerald-300/80 mb-1">
                                Resposta do suporte
                              </p>
                              <p className="text-xs text-emerald-100 leading-relaxed whitespace-pre-wrap">
                                {ticket.admin_response}
                              </p>
                              {ticket.resolved_at && (
                                <p className="text-[10px] text-emerald-300/60 mt-1.5">
                                  Resolvido em {new Date(ticket.resolved_at).toLocaleString('pt-BR')}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Feedback
