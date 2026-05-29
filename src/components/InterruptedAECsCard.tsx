/**
 * InterruptedAECsCard — card no Dashboard Profissional pra gerenciar AECs
 * INTERRUPTED órfãs (4 reais empíricamente em 29/05).
 *
 * V1.9.500 (Pedro 29/05 — Sprint A pós P0).
 *
 * UX:
 *  - Card compacto com badge contagem + cor por urgência (>30d vermelho)
 *  - Click abre modal lista detalhada
 *  - Cada linha: paciente / fase interrompida / dias atrás / ações
 *  - Ações: Invalidar (com motivo) / Marcar concluída
 *
 * NÃO oferece "Retomar": fluxo natural é paciente abrir app + auto-pause
 * detector retoma sessão. Médico não pode forçar paciente.
 */
import React, { useState } from 'react'
import { AlertCircle, X, Loader2, Inbox, ShieldOff, CheckCircle2, Clock } from 'lucide-react'
import { useInterruptedAECs, getPhaseLabel, type InterruptedAEC } from '../hooks/useInterruptedAECs'

interface Props {
  embedded?: boolean  // se true, renderiza inline (não card próprio)
}

const INVALIDATION_REASONS = [
  'Paciente cancelou tratamento',
  'Sessão de teste / debug',
  'Erro técnico (refazer)',
  'Paciente não respondeu (>30d)',
  'Duplicada (paciente recomeçou outra)',
  'Outro motivo (especificar)',
] as const

export const InterruptedAECsCard: React.FC<Props> = () => {
  const aecs = useInterruptedAECs()
  const [modalOpen, setModalOpen] = useState(false)
  const [invalidatingId, setInvalidatingId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [invalidateTarget, setInvalidateTarget] = useState<InterruptedAEC | null>(null)
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [customReason, setCustomReason] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const count = aecs.items.length
  const oldest = aecs.items[aecs.items.length - 1]
  const oldestDays = oldest?.days_ago || 0

  // Cor por urgência: count=0 verde / >0 amber / >30d red
  const cardBorder = count === 0
    ? 'border-emerald-500/20'
    : oldestDays > 30
      ? 'border-red-500/40'
      : 'border-amber-500/30'
  const cardBg = count === 0
    ? 'bg-emerald-500/5'
    : oldestDays > 30
      ? 'bg-red-500/5'
      : 'bg-amber-500/5'
  const iconColor = count === 0
    ? 'text-emerald-300'
    : oldestDays > 30
      ? 'text-red-300'
      : 'text-amber-300'

  const handleInvalidateClick = (item: InterruptedAEC) => {
    setInvalidateTarget(item)
    setSelectedReason(INVALIDATION_REASONS[0])
    setCustomReason('')
  }

  const handleSubmitInvalidate = async () => {
    if (!invalidateTarget) return
    const finalReason = selectedReason === 'Outro motivo (especificar)'
      ? customReason.trim()
      : selectedReason
    if (!finalReason) {
      setFeedback('Especifique o motivo')
      return
    }
    setInvalidatingId(invalidateTarget.id)
    const result = await aecs.invalidate(invalidateTarget.id, finalReason)
    setInvalidatingId(null)
    if (result.ok) {
      setFeedback(`AEC de ${invalidateTarget.patient_name || 'paciente'} invalidada (${finalReason})`)
      setInvalidateTarget(null)
      setTimeout(() => setFeedback(null), 4000)
    } else {
      setFeedback(`Erro: ${result.error}`)
    }
  }

  const handleMarkComplete = async (item: InterruptedAEC) => {
    if (!confirm(`Marcar AEC de ${item.patient_name || 'paciente'} como concluída? Use apenas se paciente concluiu offline e quer encerrar a sessão pendente.`)) return
    setCompletingId(item.id)
    const result = await aecs.markComplete(item.id)
    setCompletingId(null)
    if (result.ok) {
      setFeedback(`AEC marcada como concluída`)
      setTimeout(() => setFeedback(null), 4000)
    } else {
      setFeedback(`Erro: ${result.error}`)
    }
  }

  return (
    <>
      <div className={`bg-slate-900/40 border ${cardBorder} ${cardBg} rounded-2xl p-5 backdrop-blur-xl`}>
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <AlertCircle className={`w-4 h-4 ${iconColor}`} /> AECs Interrompidas
          {count > 0 && (
            <span className={`text-xs font-mono px-1.5 py-0.5 rounded-full ${oldestDays > 30 ? 'bg-red-500/20 text-red-200' : 'bg-amber-500/20 text-amber-200'}`}>
              {count}
            </span>
          )}
        </h3>
        {aecs.loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando…
          </div>
        ) : aecs.error ? (
          <p className="text-xs text-red-300">Erro: {aecs.error}</p>
        ) : count === 0 ? (
          <p className="text-xs text-emerald-300/80">Sem AECs pendentes ✓</p>
        ) : (
          <>
            <p className="text-xs text-slate-300 mb-3">
              {count} {count === 1 ? 'avaliação' : 'avaliações'} aguardando decisão.
              {oldestDays > 30 && <span className="block mt-1 text-red-300">⚠ Mais antiga há {oldestDays} dias</span>}
            </p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`w-full text-xs font-semibold px-3 py-2 rounded-lg transition-colors ${
                oldestDays > 30
                  ? 'bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/40'
                  : 'bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 border border-amber-500/40'
              }`}
            >
              Gerenciar →
            </button>
          </>
        )}
      </div>

      {/* Modal — lista detalhada + ações */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false) }}
        >
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl max-w-3xl w-full my-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">AECs Interrompidas</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {count} órfãs aguardando decisão. Invalidar preserva o registro (audit LGPD); não deleta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="mx-4 mt-3 text-[11px] text-emerald-200 bg-emerald-500/10 border border-emerald-500/30 rounded px-2 py-1">
                {feedback}
              </div>
            )}

            <div className="p-4 space-y-2">
              {aecs.items.length === 0 ? (
                <div className="text-center py-8">
                  <Inbox className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">Nenhuma AEC interrompida pendente.</p>
                </div>
              ) : (
                aecs.items.map((item) => {
                  const isOld = item.days_ago > 30
                  return (
                    <div
                      key={item.id}
                      className={`bg-slate-800/40 border rounded-lg p-3 ${isOld ? 'border-red-500/40' : 'border-slate-700/50'}`}
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-white truncate">
                            {item.patient_name || 'Paciente sem nome'}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {item.days_ago === 0 ? 'hoje' : item.days_ago === 1 ? 'ontem' : `há ${item.days_ago} dias`}
                            </span>
                            <span>·</span>
                            <span>Fase interrompida: <strong className="text-slate-200">{getPhaseLabel(item.interrupted_from_phase) === '—' ? getPhaseLabel(item.phase) : getPhaseLabel(item.interrupted_from_phase)}</strong></span>
                            {item.consent_given && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-300">Consentimento dado</span>
                              </>
                            )}
                            {isOld && (
                              <>
                                <span>·</span>
                                <span className="text-red-300 font-semibold">URGENTE</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMarkComplete(item)}
                            disabled={completingId === item.id}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-emerald-200 hover:bg-emerald-500/10 rounded transition-colors disabled:opacity-50"
                            title="Marcar como concluída (use só se paciente terminou offline)"
                          >
                            {completingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            <span className="hidden sm:inline">Concluir</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInvalidateClick(item)}
                            disabled={invalidatingId === item.id}
                            className="flex items-center gap-1 px-2 py-1 text-[11px] text-slate-300 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                            title="Invalidar com motivo"
                          >
                            <ShieldOff className="w-3 h-3" />
                            <span className="hidden sm:inline">Invalidar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal — confirmar invalidação com motivo */}
      {invalidateTarget && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/40 rounded-xl max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white">Invalidar AEC</h3>
              <button
                type="button"
                onClick={() => setInvalidateTarget(null)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Paciente: <strong className="text-slate-200">{invalidateTarget.patient_name}</strong>
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] text-slate-400">Motivo da invalidação</label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
              >
                {INVALIDATION_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              {selectedReason === 'Outro motivo (especificar)' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  rows={2}
                  maxLength={300}
                  placeholder="Especifique o motivo..."
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setInvalidateTarget(null)}
                disabled={invalidatingId !== null}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitInvalidate}
                disabled={invalidatingId !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-500/15 text-red-200 border border-red-500/40 rounded hover:bg-red-500/25 transition-colors disabled:opacity-50"
              >
                {invalidatingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                Confirmar invalidação
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
