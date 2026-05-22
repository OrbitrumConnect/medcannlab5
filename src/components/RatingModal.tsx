import React, { useState } from 'react'
import { X, Star } from 'lucide-react'
import { supabase } from '../lib/supabase'

/**
 * V1.9.145 — RatingModal
 *
 * Modal pra paciente avaliar consulta concluída.
 * 5 estrelas clicáveis + comentário opcional.
 *
 * Submit:
 *   1. INSERT conversation_ratings (rating, comment, appointment_id, patient_id, professional_id)
 *      RLS garante que appointment é do paciente E status='completed'
 *   2. UPDATE pending_ratings SET status='completed' WHERE appointment_id=...
 *
 * Anti-fraude:
 *   - 1 avaliação por appointment (UNIQUE constraint)
 *   - Só paciente que TEVE consulta status='completed' pode INSERT (RLS)
 *   - Edição permitida 24h (RLS patient_update_own_rating_24h)
 */

interface RatingModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string
  patientId: string
  professionalId: string
  professionalName: string
  onSuccess?: () => void
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  professionalId,
  professionalName,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      setError('Selecione uma nota de 1 a 5 estrelas.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      // 1. INSERT conversation_ratings (RLS valida appointment + paciente)
      const { error: insertErr } = await (supabase as any)
        .from('conversation_ratings')
        .insert({
          appointment_id: appointmentId,
          patient_id: patientId,
          professional_id: professionalId,
          rating,
          comment: comment.trim() || null,
          context: 'appointment',
        })

      if (insertErr) {
        // 23505 = unique violation (já avaliou) → tratamento amigável
        if (insertErr.code === '23505') {
          setError('Você já avaliou esta consulta.')
        } else {
          setError(`Erro ao salvar avaliação: ${insertErr.message}`)
        }
        setSubmitting(false)
        return
      }

      // 2. UPDATE pending_ratings (best-effort — não bloqueia se falhar)
      await (supabase as any)
        .from('pending_ratings')
        .update({ status: 'completed' })
        .eq('appointment_id', appointmentId)

      setSubmitting(false)
      onSuccess?.()
      onClose()
      // Reset state
      setRating(0)
      setHoverRating(0)
      setComment('')
    } catch (err: any) {
      setError(`Erro inesperado: ${String(err?.message || err)}`)
      setSubmitting(false)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-brand-bg border border-brand-border rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-brand-text text-lg font-semibold">Avalie sua consulta</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-text transition-colors"
            disabled={submitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profissional */}
        <p className="text-brand-text-secondary text-sm mb-4">
          Como foi sua experiência com{' '}
          <strong className="text-brand-text">{professionalName}</strong>?
        </p>

        {/* Stars */}
        <div className="flex items-center justify-center gap-2 mb-5" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1 transition-transform hover:scale-110"
              aria-label={`${n} ${n === 1 ? 'estrela' : 'estrelas'}`}
              role="radio"
              aria-checked={rating === n}
              disabled={submitting}
            >
              <Star
                className={`w-9 h-9 transition-colors ${
                  n <= displayRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Label */}
        {displayRating > 0 && (
          <p className="text-center text-sm text-brand-text-muted mb-4">
            {displayRating === 1 && 'Muito insatisfeito'}
            {displayRating === 2 && 'Insatisfeito'}
            {displayRating === 3 && 'Regular'}
            {displayRating === 4 && 'Satisfeito'}
            {displayRating === 5 && 'Muito satisfeito'}
          </p>
        )}

        {/* Comment */}
        <label className="block text-xs text-brand-text-muted mb-1.5" htmlFor="rating-comment">
          Comentário (opcional)
        </label>
        <textarea
          id="rating-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Conte como foi sua experiência..."
          className="w-full bg-brand-surface border border-brand-border rounded-lg p-2.5 text-sm text-brand-text placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          disabled={submitting}
        />
        <p className="text-[10px] text-slate-500 mt-1 text-right">
          {comment.length}/500
        </p>

        {/* Error */}
        {error && (
          <div className="mt-3 p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-brand-text-secondary bg-brand-surface hover:bg-brand-surface-subtle transition-colors"
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating < 1}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-brand-text bg-emerald-600 hover:bg-emerald-500 disabled:bg-brand-surface-subtle disabled:text-slate-500 transition-colors"
          >
            {submitting ? 'Enviando...' : 'Enviar avaliação'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default RatingModal
