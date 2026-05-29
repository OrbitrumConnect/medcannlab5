/**
 * EvaluationInstrumentAdminModal — modal admin pra criar/editar instrumentos
 * de avaliação (Rubrica, Casos, Portfolio, Simulação, Prova).
 *
 * V1.9.496 (Sprint E Vertical 2 — Pedro 29/05).
 * Pattern consistente com NewsItemAdminModal V1.9.495.
 *
 * Apenas admin/master/gestor (RLS protege; UI esconde botão admin no caller).
 */
import React, { useState, useEffect } from 'react'
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import {
  INSTRUMENT_CATEGORIES,
  INSTRUMENT_STATUSES,
  INSTRUMENT_AUDIENCES,
  type EvaluationInstrument,
  type EvaluationInstrumentInput,
  type InstrumentCategory,
  type InstrumentStatus,
  type InstrumentAudience,
} from '../hooks/useEvaluationInstruments'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialItem?: EvaluationInstrument  // se presente, modo edição
  onSubmit: (input: EvaluationInstrumentInput) => Promise<{ ok: boolean; error?: string; id?: string }>
}

export const EvaluationInstrumentAdminModal: React.FC<Props> = ({ isOpen, onClose, initialItem, onSubmit }) => {
  const isEdit = !!initialItem
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<InstrumentCategory>('rubrica')
  const [status, setStatus] = useState<InstrumentStatus>('aberto')
  const [audience, setAudience] = useState<InstrumentAudience>('aluno')
  const [totalPoints, setTotalPoints] = useState<string>('100')
  const [published, setPublished] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title)
      setDescription(initialItem.description || '')
      setCategory(initialItem.category)
      setStatus(initialItem.status)
      setAudience(initialItem.target_audience)
      setTotalPoints(initialItem.total_points?.toString() || '100')
      setPublished(initialItem.published)
    } else {
      setTitle('')
      setDescription('')
      setCategory('rubrica')
      setStatus('aberto')
      setAudience('aluno')
      setTotalPoints('100')
      setPublished(false)
    }
    setError(null)
  }, [initialItem, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Título obrigatório')
      return
    }
    setSubmitting(true)
    const pointsNum = parseInt(totalPoints, 10)
    const input: EvaluationInstrumentInput = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      status,
      target_audience: audience,
      published,
      total_points: isNaN(pointsNum) ? null : pointsNum,
    }
    const result = await onSubmit(input)
    setSubmitting(false)
    if (result.ok) {
      onClose()
    } else {
      setError(result.error || 'Erro ao salvar')
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl max-w-xl w-full p-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Editar' : 'Novo'} Instrumento de Avaliação
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Título */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Título <span className="text-red-300">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              placeholder="Ex: Rubrica AEC 360º"
              maxLength={200}
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              rows={3}
              maxLength={1000}
              placeholder="O que este instrumento avalia e como o mentor preenche."
            />
            <div className="text-[10px] text-slate-500 mt-0.5">{description.length}/1000</div>
          </div>

          {/* Categoria + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as InstrumentCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              >
                {INSTRUMENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InstrumentStatus)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              >
                {INSTRUMENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audience + Points */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Audiência</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as InstrumentAudience)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              >
                {INSTRUMENT_AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Pontos totais</label>
              <input
                type="number"
                min="0"
                value={totalPoints}
                onChange={(e) => setTotalPoints(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                placeholder="100"
              />
            </div>
          </div>

          {/* Publicado toggle */}
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 border border-slate-700 rounded">
            <div className="flex items-center gap-2">
              {published ? <Eye className="w-4 h-4 text-emerald-300" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
              <span className="text-sm text-white">
                {published ? 'Publicado (visível pra audiência)' : 'Rascunho (só admins veem)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPublished((v) => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                published ? 'bg-emerald-500' : 'bg-slate-600'
              }`}
              aria-pressed={published}
              aria-label="Alternar publicação"
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  published ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

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
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-500/15 text-amber-200 border border-amber-500/40 rounded hover:bg-amber-500/25 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {isEdit ? 'Salvar alterações' : 'Criar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
