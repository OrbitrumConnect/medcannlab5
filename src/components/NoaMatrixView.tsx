/**
 * NoaMatrixView — view dedicada Nôa Matrix no Terminal de Pesquisa.
 *
 * V1.9.379-D — Integração final Fase 1.
 *
 * Layout 2 colunas (lg+):
 *  - ESQUERDA: cards anexáveis (Casos Similares marcados + Notas Rápidas)
 *  - DIREITA: ResearchChat (V1.9.379-C) com attachedContext composto
 *
 * Atrito intencional (Material A Pedro+Ricardo):
 *  - Cards começam não-selecionados
 *  - Médico marca explicitamente quais quer "trazer pro chat"
 *  - Contexto só é injetado quando médico confirma seleção
 *  - Toggle visual claro entre "marcado" e "não-marcado"
 *
 * Reusa:
 *  - useSearchHistory (V1.9.364/365 — caseOpens, notes, pinned)
 *  - ResearchChat (V1.9.379-C)
 *  - useResearchChat (hook bypassFSM)
 *
 * Princípios cristalizados aplicados:
 *  - feedback_publicacao_nao_e_exploracao_interna_18_05 (chat estrutura, médico decide)
 *  - feedback_limitar_autoridade_computacional_19_05 (Z2 only, sem síntese clínica)
 *  - polir-não-inventar (reusa hooks/componentes existentes)
 */
import React, { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSearchHistory } from '../hooks/useSearchHistory'
import { usePatientLongitudinal } from '../hooks/usePatientLongitudinal'
import { ResearchChat } from './ResearchChat'
import { Sparkles, FileText, StickyNote, Check, Info, Folder, User, Stethoscope, Activity } from 'lucide-react'

interface AttachableCard {
  id: string
  type: 'case' | 'note' | 'pinned-search' | 'patient-report' | 'patient-rationality'
  title: string
  subtitle?: string
  body: string  // texto que vai pro contexto do chat
  timestamp?: number
}

const RATIONALITY_LABELS: Record<string, string> = {
  biomedical: 'Biomédica',
  traditional_chinese: 'MTC',
  ayurvedic: 'Ayurveda',
  homeopathic: 'Homeopatia',
  integrative: 'Integrativa',
}

export const NoaMatrixView: React.FC = () => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  // V1.9.382 — patientId vindo do Terminal de Atendimento (trigger "Levar para Nôa Matrix")
  // Médico abre paciente em foco e clica botão pra trazer recortes longitudinais pro chat.
  const patientId = searchParams.get('patientId') || undefined
  const history = useSearchHistory(user?.id)
  const longitudinal = usePatientLongitudinal(patientId)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Compor lista de cards anexáveis a partir de múltiplas fontes.
  // V1.9.379-D: localStorage (caseOpens + notes + pinned)
  // V1.9.382: + clinical_reports + clinical_rationalities do paciente em foco (longitudinal)
  const cards = useMemo<AttachableCard[]>(() => {
    const list: AttachableCard[] = []

    // V1.9.382 — Recortes longitudinais do paciente em foco (vindo do Terminal de Atendimento)
    // Aparecem PRIMEIRO porque são contexto explícito que o médico trouxe.
    // V1.9.384 — body usa pseudônimo (LGPD higiene). Médico vê nome real só no banner topo.
    const pseudonym = longitudinal.patientPseudonym ? `Paciente #${longitudinal.patientPseudonym}` : 'Paciente'
    longitudinal.reports.forEach((r) => {
      const dateStr = new Date(r.created_at).toLocaleDateString('pt-BR')
      const lista = r.listaIndiciaria && r.listaIndiciaria.length > 0
        ? r.listaIndiciaria.filter(Boolean).join(', ')
        : ''
      list.push({
        id: `pr-${r.id}`,
        type: 'patient-report',
        title: `Relatório de ${dateStr}`,
        subtitle: `${r.status}${r.signed_at ? ' · ICP' : ''}`,
        body: `Relatório clínico de ${pseudonym} (${dateStr})\nStatus: ${r.status}${r.signed_at ? ' (assinado ICP-Brasil)' : ''}${r.mainComplaint ? `\nQueixa principal: "${r.mainComplaint}"` : ''}${lista ? `\nLista indiciária: ${lista}` : ''}`,
        timestamp: new Date(r.created_at).getTime(),
      })
    })

    longitudinal.rationalities.forEach((r) => {
      const dateStr = new Date(r.created_at).toLocaleDateString('pt-BR')
      const label = RATIONALITY_LABELS[r.rationality_type] || r.rationality_type
      list.push({
        id: `pr-rat-${r.id}`,
        type: 'patient-rationality',
        title: `Racionalidade ${label} (${dateStr})`,
        subtitle: r.rationality_type,
        body: `Racionalidade ${label} aplicada a ${pseudonym} em ${dateStr}${r.assessmentExcerpt ? `\nRecorte: "${r.assessmentExcerpt}..."` : ''}`,
        timestamp: new Date(r.created_at).getTime(),
      })
    })

    // V1.9.379-D — Casos abertos (até 12 mais recentes)
    history.caseOpens.slice(0, 12).forEach((c) => {
      list.push({
        id: `case-${c.caseId}`,
        type: 'case',
        title: c.patientName || 'Paciente sem nome',
        subtitle: new Date(c.ts).toLocaleDateString('pt-BR'),
        body: `Caso #${c.caseId.slice(-6)} (${c.patientName})${c.queixa ? `\nQueixa: "${c.queixa}"` : ''}`,
        timestamp: c.ts,
      })
    })

    // Notas (1 bloco grande se não-vazio)
    if (history.notes && history.notes.trim().length > 0) {
      list.push({
        id: 'note-scratchpad',
        type: 'note',
        title: 'Suas notas rápidas',
        subtitle: `${history.notes.length} caracteres`,
        body: `Notas do médico:\n${history.notes.trim()}`,
      })
    }

    // Buscas favoritadas (pinned) — até 6 mais recentes
    history.pinned.slice(0, 6).forEach((p) => {
      list.push({
        id: `pinned-${p.ts}`,
        type: 'pinned-search',
        title: `"${p.term}"`,
        subtitle: `${p.rationality === 'all' ? 'Todas racionalidades' : p.rationality} · ${p.period}d`,
        body: `Busca favoritada: termo "${p.term}", filtro ${p.rationality}, últimos ${p.period} dias`,
        timestamp: p.ts,
      })
    })

    return list
  }, [history.caseOpens, history.notes, history.pinned, longitudinal.reports, longitudinal.rationalities])

  const toggleCard = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Compor contexto pra passar pro ResearchChat.
  const attachedContext = useMemo(() => {
    if (selectedIds.size === 0) return ''
    const selected = cards.filter((c) => selectedIds.has(c.id))
    return selected
      .map((c) => `[${c.type === 'case' ? 'CASO MARCADO' : c.type === 'note' ? 'NOTAS DO MÉDICO' : 'BUSCA FAVORITADA'}]\n${c.body}`)
      .join('\n\n---\n\n')
  }, [selectedIds, cards])

  const selectedCount = selectedIds.size

  return (
    <div className="space-y-4">
      {/* V1.9.382/384 — Banner contextual com nome real (médico identifica)
           + pseudônimo (Matrix usa nas conversas/contexto pra GPT) */}
      {patientId && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-3">
          <User className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-amber-200">
              Sessão sobre {longitudinal.patientName || 'paciente'}
              {longitudinal.patientPseudonym && (
                <span className="ml-2 text-[10px] font-mono text-amber-300/70">
                  · contexto Matrix usa código <strong>#{longitudinal.patientPseudonym}</strong> (LGPD)
                </span>
              )}
            </div>
            <div className="text-[10px] text-amber-300/70 mt-0.5">
              {longitudinal.loading
                ? 'Carregando recortes longitudinais...'
                : longitudinal.error
                  ? `Erro: ${longitudinal.error}`
                  : `${longitudinal.reports.length} relatório(s) e ${longitudinal.rationalities.length} racionalidade(s) disponíveis abaixo. Marque o que considerar relevante.`}
            </div>
          </div>
        </div>
      )}

      {/* Header da view */}
      <div className="bg-slate-900/40 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>🧬 Nôa Matrix</span>
                <span className="text-[10px] font-normal text-purple-300/70 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  Z2 estrutural
                </span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                Chat de pesquisa não-diretivo. Marque casos, notas e buscas favoritas pra estruturar raciocínio.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Folder className="w-3.5 h-3.5 text-purple-300" />
            <span className="text-slate-400">
              {selectedCount === 0 ? 'Nenhum item marcado' : `${selectedCount} item${selectedCount === 1 ? '' : 'ns'} no chat`}
            </span>
          </div>
        </div>

        {/* Disclaimer permanente Z2 */}
        <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-purple-500/5 border border-purple-500/15">
          <Info className="w-3.5 h-3.5 text-purple-300/70 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-purple-300">Como funciona:</strong> marque cards de Casos Similares,
            notas rápidas e buscas favoritas que considerar relevantes.
            A Nôa Matrix lê APENAS o material marcado e ajuda a comparar, agrupar e citar — não sugere conduta nem infere diagnóstico.
          </p>
        </div>
      </div>

      {/* Grid: cards (esquerda) + chat (direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Cards anexáveis */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Material disponível
            </h3>
            {selectedCount > 0 && (
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[10px] text-slate-500 hover:text-purple-300 transition-colors"
              >
                limpar seleção
              </button>
            )}
          </div>

          {cards.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-700/30 rounded-xl p-6 text-center">
              <Folder className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-1">Nenhum material marcado ainda.</p>
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Abra casos em <strong className="text-purple-300">Casos Similares</strong>,
                escreva notas no painel lateral e favorite buscas — depois volte aqui pra trazer ao chat.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {cards.map((card) => {
                const isSelected = selectedIds.has(card.id)
                const Icon =
                  card.type === 'patient-report' ? Stethoscope :
                  card.type === 'patient-rationality' ? Activity :
                  card.type === 'case' ? FileText :
                  card.type === 'note' ? StickyNote :
                  Sparkles
                return (
                  <button
                    key={card.id}
                    onClick={() => toggleCard(card.id)}
                    className={`w-full text-left rounded-lg p-3 border transition-all ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500/40 shadow-md shadow-purple-500/10'
                        : 'bg-slate-900/40 border-slate-700/30 hover:border-purple-500/30 hover:bg-purple-500/5'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`mt-0.5 flex-shrink-0 p-1 rounded ${isSelected ? 'bg-purple-500/20' : 'bg-slate-800/60'}`}>
                        {isSelected ? (
                          <Check className="w-3 h-3 text-purple-300" />
                        ) : (
                          <Icon className="w-3 h-3 text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{card.title}</div>
                        {card.subtitle && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{card.subtitle}</div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {card.body.split('\n').slice(0, 2).join(' · ')}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-7">
          <ResearchChat attachedContext={attachedContext} />
        </div>
      </div>
    </div>
  )
}
