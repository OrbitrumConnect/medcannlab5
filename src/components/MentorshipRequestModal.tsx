/**
 * MentorshipRequestModal — modal pra aluno/usuário solicitar mentoria.
 *
 * V1.9.497 (Sprint E Vertical 3 — Pedro 29/05).
 *
 * Substitui modal inline antigo em EnsinoDashboard.tsx que escrevia em
 * `appointments` com doctor_id STRING (anti-padrão UUID). Agora escreve em
 * `mentorship_requests` (FK pra mentor_profiles.id UUID + RLS protege).
 *
 * Disponibilidade do mentor:
 *  - Helper isValidDateForMentor / getAvailableTimes ainda recebe slug (estável)
 *  - Default permissivo se slug desconhecido (futuros mentores)
 */
import React, { useState, useEffect } from 'react'
import { X, Send, Loader2, Calendar, Clock, MessageCircle } from 'lucide-react'
import type { MentorProfile, MentorshipRequestInput } from '../hooks/useMentorship'

interface Props {
  isOpen: boolean
  mentor: MentorProfile | null
  onClose: () => void
  onSubmit: (input: MentorshipRequestInput) => Promise<{ ok: boolean; error?: string; id?: string }>
}

// V1.9.497 — disponibilidade por slug (estável vs id UUID que muda por seed).
// Mentores futuros sem regra explícita = todos dias permitidos.
function isValidDateForMentor(dateString: string, slug: string): boolean {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay()
  if (slug === 'ricardo-valenca') {
    // Terça/Quarta/Quinta
    return dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4
  }
  if (slug === 'eduardo-faveret') {
    // Só Terça
    return dayOfWeek === 2
  }
  return true
}

function getAvailableTimes(slug: string): string[] {
  if (slug === 'ricardo-valenca') {
    const times: string[] = []
    for (let hour = 14; hour < 20; hour++) {
      times.push(`${hour.toString().padStart(2, '0')}:00`)
      times.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return times
  }
  if (slug === 'eduardo-faveret') {
    return ['19:00', '19:30', '20:00', '20:30']
  }
  // Slot livre pra mentores sem regra explícita
  const times: string[] = []
  for (let hour = 9; hour < 20; hour++) {
    times.push(`${hour.toString().padStart(2, '0')}:00`)
    times.push(`${hour.toString().padStart(2, '0')}:30`)
  }
  return times
}

function getValidDaysLabel(slug: string): string {
  if (slug === 'ricardo-valenca') return 'Terça, Quarta, Quinta'
  if (slug === 'eduardo-faveret') return 'Terça'
  return 'Qualquer dia'
}

export const MentorshipRequestModal: React.FC<Props> = ({ isOpen, mentor, onClose, onSubmit }) => {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDate('')
      setTime('')
      setTopic('')
      setMessage('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  if (!isOpen || !mentor) return null

  const availableTimes = getAvailableTimes(mentor.slug)

  const handleSubmit = async () => {
    setError(null)
    if (!topic.trim()) {
      setError('Tópico da mentoria é obrigatório')
      return
    }
    if (!date || !time) {
      setError('Data e horário preferidos são obrigatórios')
      return
    }
    setSubmitting(true)
    const input: MentorshipRequestInput = {
      mentor_profile_id: mentor.id,
      preferred_date: date,
      preferred_time: time,
      topic: topic.trim(),
      message: message.trim() || null,
    }
    const result = await onSubmit(input)
    setSubmitting(false)
    if (result.ok) {
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1800)
    } else {
      setError(result.error || 'Erro ao enviar solicitação')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-xl max-w-xl w-full p-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Solicitar Mentoria</h2>
            <p className="text-sm text-slate-400 mt-0.5">{mentor.display_name}</p>
            <p className="text-[11px] text-slate-500">{mentor.role}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-3">
              <Send className="w-6 h-6 text-emerald-300" />
            </div>
            <p className="text-emerald-300 font-semibold">Solicitação enviada com sucesso!</p>
            <p className="text-xs text-slate-400 mt-1">Você receberá retorno em breve por <strong>{mentor.channel || 'canal a definir'}</strong>.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Tópico */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                Tópico da mentoria <span className="text-red-300">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                placeholder="Ex: Revisão de caso clínico AEC + dor crônica"
                maxLength={150}
              />
            </div>

            {/* Data + Horário */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Data preferida <span className="text-red-300">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v || isValidDateForMentor(v, mentor.slug)) {
                      setDate(v)
                      setError(null)
                    } else {
                      setError(`Mentor disponível: ${getValidDaysLabel(mentor.slug)}`)
                    }
                  }}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Disponível: {getValidDaysLabel(mentor.slug)}</p>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Horário <span className="text-red-300">*</span>
                </label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                  disabled={availableTimes.length === 0}
                >
                  <option value="">Selecione...</option>
                  {availableTimes.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {mentor.availability && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{mentor.availability}</p>
                )}
              </div>
            </div>

            {/* Mensagem */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Mensagem (opcional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
                rows={3}
                maxLength={500}
                placeholder="Contexto adicional, link de caso, dúvidas específicas..."
              />
              <div className="text-[10px] text-slate-500 mt-0.5">{message.length}/500</div>
            </div>

            {/* Info canal */}
            {mentor.channel && (
              <div className="text-[11px] text-slate-400 bg-slate-800/40 border border-slate-700/50 rounded px-2.5 py-2">
                <strong className="text-slate-300">Canal:</strong> {mentor.channel}
                {mentor.focus && (
                  <>
                    <br />
                    <strong className="text-slate-300">Foco:</strong> {mentor.focus}
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3 py-1.5 text-sm text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !topic.trim() || !date || !time}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-500/15 text-emerald-200 border border-emerald-500/40 rounded hover:bg-emerald-500/25 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Enviar solicitação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
