/**
 * AdminFeedbackList — V1.9.486 (Pedro 28/05/2026)
 * Painel admin pra listar e responder feedbacks dos usuários.
 *
 * RLS protege: só admin vê todos os tickets.
 * Reusa useFeedback hook (V1.9.486).
 *
 * UX: lista compacta com filtro de status + drawer/modal pra responder.
 */
import React, { useEffect, useMemo, useState } from 'react'
import { useFeedback, type FeedbackTicket, type FeedbackStatus } from '../hooks/useFeedback'
import { AlertTriangle, HelpCircle, Lightbulb, Bug, Heart, MessageSquare, Loader2, Check, Clock, X } from 'lucide-react'

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  duvida: { label: 'Dúvida', icon: <HelpCircle className="w-4 h-4 text-blue-400" /> },
  sugestao: { label: 'Sugestão', icon: <Lightbulb className="w-4 h-4 text-amber-400" /> },
  problema: { label: 'Problema', icon: <Bug className="w-4 h-4 text-red-400" /> },
  elogio: { label: 'Elogio', icon: <Heart className="w-4 h-4 text-pink-400" /> },
}

const STATUS_META: Record<FeedbackStatus, { label: string; color: string }> = {
  open: { label: 'Aberto', color: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  in_progress: { label: 'Em andamento', color: 'text-blue-300 bg-blue-500/10 border-blue-500/30' },
  resolved: { label: 'Resolvido', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  closed: { label: 'Fechado', color: 'text-slate-400 bg-slate-700/30 border-slate-600/30' },
}

const AdminFeedbackList: React.FC = () => {
  const { listFeedbacks, respondFeedback, loading, error } = useFeedback()
  const [tickets, setTickets] = useState<FeedbackTicket[]>([])
  const [filter, setFilter] = useState<FeedbackStatus | 'all' | 'urgent'>('open')
  const [selected, setSelected] = useState<FeedbackTicket | null>(null)
  const [responseText, setResponseText] = useState('')
  const [updating, setUpdating] = useState(false)

  const refresh = async () => {
    const data = await listFeedbacks(100)
    setTickets(data)
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return tickets
    if (filter === 'urgent') return tickets.filter((t) => t.is_urgent && t.status !== 'resolved' && t.status !== 'closed')
    return tickets.filter((t) => t.status === filter)
  }, [tickets, filter])

  const counts = useMemo(() => {
    return {
      all: tickets.length,
      urgent: tickets.filter((t) => t.is_urgent && t.status !== 'resolved' && t.status !== 'closed').length,
      open: tickets.filter((t) => t.status === 'open').length,
      in_progress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
    }
  }, [tickets])

  const openTicket = (ticket: FeedbackTicket) => {
    setSelected(ticket)
    setResponseText(ticket.admin_response || '')
  }

  const closeTicket = () => {
    setSelected(null)
    setResponseText('')
  }

  const submitResponse = async (newStatus: FeedbackStatus) => {
    if (!selected) return
    setUpdating(true)
    const ok = await respondFeedback(selected.id, newStatus, responseText.trim() || undefined)
    setUpdating(false)
    if (ok) {
      await refresh()
      closeTicket()
    }
  }

  return (
    <div className="min-h-screen app-bg-gradient p-4 sm:p-6 text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">Feedbacks dos usuários</h1>
            <p className="text-xs text-slate-400">
              Canal aberto · dúvidas / sugestões / problemas / elogios · escalação urgente notifica por email
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { value: 'urgent' as const, label: '🚨 Urgentes', count: counts.urgent },
            { value: 'open' as const, label: 'Abertos', count: counts.open },
            { value: 'in_progress' as const, label: 'Em andamento', count: counts.in_progress },
            { value: 'resolved' as const, label: 'Resolvidos', count: counts.resolved },
            { value: 'closed' as const, label: 'Fechados', count: counts.closed },
            { value: 'all' as const, label: 'Todos', count: counts.all },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                  : 'bg-slate-800/40 border border-slate-700/50 text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              {f.label} <span className="ml-1 opacity-60">({f.count})</span>
            </button>
          ))}
        </div>

        {/* Erro */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && tickets.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Carregando feedbacks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
            <p>Nenhum feedback nesse filtro.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((ticket) => {
              const cat = CATEGORY_META[ticket.category] || { label: ticket.category, icon: null }
              const stat = STATUS_META[ticket.status]
              return (
                <button
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className="w-full text-left p-3 sm:p-4 rounded-lg bg-slate-900/40 border border-slate-700/50 hover:bg-slate-800/60 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold truncate">{ticket.subject}</span>
                        {ticket.is_urgent && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-amber-300 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Urgente
                          </span>
                        )}
                        <span className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded border ${stat.color}`}>
                          {stat.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{ticket.message}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-2">
                        <span>{cat.label}</span>
                        <span>·</span>
                        <span>{ticket.user_role}</span>
                        <span>·</span>
                        <span>{new Date(ticket.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Modal responder */}
        {selected && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4"
            onClick={!updating ? closeTicket : undefined}
          >
            <div
              className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-3 sm:p-4 border-b border-emerald-500/20 bg-slate-900/95 backdrop-blur-md rounded-t-2xl">
                <div className="flex items-center gap-2 min-w-0">
                  {CATEGORY_META[selected.category]?.icon}
                  <h2 className="text-sm sm:text-base font-semibold truncate">{selected.subject}</h2>
                </div>
                <button
                  onClick={closeTicket}
                  disabled={updating}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 sm:p-5 space-y-4">
                {/* Metadata */}
                <div className="flex flex-wrap gap-2 text-[10px] sm:text-xs">
                  <span className={`px-2 py-0.5 rounded border ${STATUS_META[selected.status].color}`}>
                    {STATUS_META[selected.status].label}
                  </span>
                  {selected.is_urgent && (
                    <span className="px-2 py-0.5 rounded border text-amber-300 bg-amber-500/10 border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Urgente
                    </span>
                  )}
                  <span className="text-slate-500">
                    {selected.user_role} · {new Date(selected.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>

                {/* Mensagem original */}
                <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-lg">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1.5">Mensagem do usuário</p>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {selected.message}
                  </p>
                </div>

                {/* Resposta admin */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                    Sua resposta (opcional)
                  </label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value.slice(0, 4000))}
                    disabled={updating}
                    rows={5}
                    maxLength={4000}
                    placeholder="Responda ao usuário (visível no painel dele futuro)"
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 disabled:opacity-50 resize-none"
                  />
                </div>

                {/* Ações */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => submitResponse('in_progress')}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Em andamento
                  </button>
                  <button
                    onClick={() => submitResponse('resolved')}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-200 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Resolver
                  </button>
                  <button
                    onClick={() => submitResponse('closed')}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600/50 text-slate-300 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    Fechar
                  </button>
                  <button
                    onClick={closeTicket}
                    disabled={updating}
                    className="flex items-center justify-center gap-1 px-2 py-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminFeedbackList
