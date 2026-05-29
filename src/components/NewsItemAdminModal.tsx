/**
 * NewsItemAdminModal — modal admin pra criar/editar Notícias & Eventos.
 *
 * V1.9.495 (Sprint E Vertical 1 — Pedro 29/05).
 *
 * Apenas admin/master/gestor pode usar (RLS protege; UI esconde botão admin
 * via role check no caller — EnsinoDashboard.tsx).
 *
 * Campos mínimos: title + summary + category + date + published.
 * Avançados (collapse): content + author + read_time + impact + source + url + tags + image_url.
 *
 * Reusa Dialog (shadcn-ui). Princípio polir-não-inventar.
 */
import React, { useState, useEffect } from 'react'
import { X, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import { NEWS_CATEGORIES, NEWS_IMPACT_OPTIONS, type NewsItem, type NewsItemInput } from '../hooks/useNewsItems'

interface Props {
  isOpen: boolean
  onClose: () => void
  initialItem?: NewsItem  // se presente, modo edição
  onSubmit: (input: NewsItemInput) => Promise<{ ok: boolean; error?: string; id?: string }>
}

export const NewsItemAdminModal: React.FC<Props> = ({ isOpen, onClose, initialItem, onSubmit }) => {
  const isEdit = !!initialItem
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string>('cannabis-medicinal')
  const [date, setDate] = useState('')
  const [author, setAuthor] = useState('')
  const [readTime, setReadTime] = useState('')
  const [impact, setImpact] = useState('')
  const [source, setSource] = useState('')
  const [url, setUrl] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [published, setPublished] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Hydrate form when initialItem changes (edit mode)
  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title)
      setSummary(initialItem.summary || '')
      setContent(initialItem.content || '')
      setCategory(initialItem.category || 'cannabis-medicinal')
      setDate(initialItem.date || '')
      setAuthor(initialItem.author || '')
      setReadTime(initialItem.read_time || '')
      setImpact(initialItem.impact || '')
      setSource(initialItem.source || '')
      setUrl(initialItem.url || '')
      setTagsText((initialItem.tags || []).join(', '))
      setImageUrl(initialItem.image_url || '')
      setPublished(!!initialItem.published)
    } else {
      // Reset for create mode
      setTitle('')
      setSummary('')
      setContent('')
      setCategory('cannabis-medicinal')
      setDate(new Date().toISOString().slice(0, 10))  // YYYY-MM-DD hoje
      setAuthor('')
      setReadTime('')
      setImpact('')
      setSource('')
      setUrl('')
      setTagsText('')
      setImageUrl('')
      setPublished(false)
    }
    setShowAdvanced(false)
    setError(null)
  }, [initialItem, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    setError(null)
    if (!title.trim()) {
      setError('Título obrigatório')
      return
    }
    if (!summary.trim()) {
      setError('Resumo obrigatório')
      return
    }
    setSubmitting(true)
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    const input: NewsItemInput = {
      title: title.trim(),
      summary: summary.trim() || null,
      content: content.trim() || null,
      category,
      date: date || undefined,
      author: author.trim() || null,
      read_time: readTime.trim() || null,
      impact: (impact.trim() === '' ? null : impact.trim()),
      source: source.trim() || null,
      url: url.trim() || null,
      tags,
      image_url: imageUrl.trim() || null,
      published,
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
      <div className="bg-slate-900 border border-amber-500/30 rounded-xl max-w-2xl w-full p-5 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            {isEdit ? 'Editar' : 'Nova'} Notícia / Evento
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
              placeholder="Ex: Seminário Cannabis & Nefrologia 2026"
              maxLength={200}
            />
          </div>

          {/* Resumo */}
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">
              Resumo <span className="text-red-300">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              rows={2}
              maxLength={500}
              placeholder="1-2 linhas que descrevem o evento/notícia."
            />
            <div className="text-[10px] text-slate-500 mt-0.5">{summary.length}/500</div>
          </div>

          {/* Categoria + Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              >
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          </div>

          {/* Publicado toggle */}
          <div className="flex items-center justify-between p-2.5 bg-slate-800/40 border border-slate-700 rounded">
            <div className="flex items-center gap-2">
              {published ? <Eye className="w-4 h-4 text-emerald-300" /> : <EyeOff className="w-4 h-4 text-slate-500" />}
              <span className="text-sm text-white">
                {published ? 'Publicado (visível pra todos)' : 'Rascunho (só admins veem)'}
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

          {/* Avançado collapse */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-xs text-amber-300/70 hover:text-amber-200"
          >
            {showAdvanced ? 'Ocultar' : 'Mostrar'} campos avançados (conteúdo, autor, tags, URL, imagem)
          </button>

          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Conteúdo completo (opcional)</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  rows={4}
                  placeholder="Texto longo (markdown ou plain)"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Autor</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    placeholder="Ex: Dr. Ricardo Valença"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Tempo de leitura</label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    placeholder="Ex: 5min"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Impacto</label>
                  <select
                    value={impact}
                    onChange={(e) => setImpact(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  >
                    {NEWS_IMPACT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Fonte</label>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    placeholder="Ex: MedCannLab / ANVISA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">URL externa</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">URL da imagem (opcional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={tagsText}
                  onChange={(e) => setTagsText(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  placeholder="cannabis, nefrologia, evento"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
              {error}
            </div>
          )}

          {/* Actions */}
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
