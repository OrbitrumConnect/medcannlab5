import React, { useMemo, useState, useEffect } from 'react'
import { ExternalLink, AlertCircle, ShieldCheck, X, FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { getBularioByMedication } from '../services/anvisaService'

// [V1.9.466] (27/05/2026) — Popover inline de bula no fluxo de prescrição
//
// Princípio Ricardo cristalizado: "Bula é INFRAESTRUTURA COGNITIVA do médico
// no MOMENTO da prescrição, não literatura farmacológica decontextualizada."
//
// Hierarquia preservada (inviolável):
//   1. Médico digita/seleciona medicamento (decisão clínica já tomada)
//   2. Popover mostra contexto documental oficial DAQUELA decisão
//   3. ZERO sugestão, ZERO recomendação, ZERO comparação cross-bulas
//   4. Médico assina ICP normalmente (popover é additive, não bloqueante)
//
// Princípio fronteira info farmacológica (memory NÍVEL 1 cristalizada hoje):
//   ✅ Organiza acesso à informação oficial (link ANVISA externo)
//   ✅ NUNCA participa da decisão terapêutica
//   ✅ Profissional-only (renderizado dentro QuickPrescriptions)
//   ✅ Opt-out via X (médico fecha se não quer ver)
//
// LocalStorage flag: 'bula_context_popover_dismissed' = string ISO da última dismissal.
// Se médico dismissou nas últimas 24h, NÃO mostra automaticamente (respeita escolha).

const LS_KEY = 'bula_context_popover_dismissed_v1_9_466'

export interface BulaContextPopoverProps {
  /** Nome do medicamento digitado/selecionado pelo médico (controlado) */
  medication: string
  /** Callback opcional ao clicar "Bula ANVISA" (analytics futuro) */
  onBulaClick?: () => void
  /** Esconde se medicamento não match no catálogo (default true — silent fail) */
  silentOnNoMatch?: boolean
}

const BulaContextPopover: React.FC<BulaContextPopoverProps> = ({
  medication,
  onBulaClick,
  silentOnNoMatch = true,
}) => {
  // Lookup memoizado (re-roda só quando medication muda)
  const bula = useMemo(() => getBularioByMedication(medication), [medication])

  // Estado dismissed pra opt-out por sessão (não persistente — só fecha card no momento)
  const [dismissed, setDismissed] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Verifica localStorage dismissal (válida por 24h)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) {
        const dismissedAt = new Date(stored).getTime()
        const hoursSince = (Date.now() - dismissedAt) / (1000 * 60 * 60)
        if (hoursSince < 24) {
          setDismissed(true)
        }
      }
    } catch {
      // Ignore (storage indisponível)
    }
  }, [])

  // Reset dismissed quando medicação muda (nova prescrição = nova chance de mostrar)
  useEffect(() => {
    setDismissed(false)
    setExpanded(false)
  }, [medication])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(LS_KEY, new Date().toISOString())
    } catch {
      // Ignore
    }
  }

  const handleBulaClick = () => {
    if (onBulaClick) onBulaClick()
  }

  // Não renderiza se:
  // - Medication string muito curta
  // - Não encontrou bula no catálogo (silentOnNoMatch)
  // - Usuário dismissou
  if (!medication || medication.trim().length < 3) return null
  if (dismissed) return null
  if (!bula && silentOnNoMatch) return null

  // Sem match e silentOnNoMatch=false → mostra hint discreto
  if (!bula) {
    return (
      <div className="mt-2 text-[11px] text-slate-500 italic flex items-center gap-1.5">
        <FileText className="w-3 h-3" />
        Medicamento não está no catálogo curado MedCannLab.{' '}
        <a
          href={`https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=${encodeURIComponent(medication)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#00E5B2] hover:underline"
        >
          Buscar direto na ANVISA →
        </a>
      </div>
    )
  }

  return (
    <div className="mt-2 bg-[rgba(0,229,178,0.06)] border border-[rgba(0,229,178,0.30)] rounded-lg overflow-hidden">
      {/* Header compacto */}
      <div className="px-3 py-2 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00E5B2] flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-white truncate" title={bula.nomeComercial}>
                {bula.nomeComercial}
              </span>
              {bula.tarja && (
                <span
                  className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                    bula.tarja === 'preta'
                      ? 'bg-black/40 border-purple-500/40 text-purple-300'
                      : bula.tarja === 'vermelha'
                      ? 'bg-red-500/15 border-red-500/40 text-red-300'
                      : bula.tarja === 'amarela'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-700/40 border-slate-500/40 text-slate-300'
                  }`}
                  title={`Tarja ${bula.tarja}`}
                >
                  {bula.tarja}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5" title={bula.principioAtivo}>
              {bula.principioAtivo}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-slate-700/40 text-slate-400 hover:text-white transition-colors flex-shrink-0"
          title="Ocultar contexto bula (até 24h)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Observação clínica (sempre visível se houver) */}
      {bula.observacao && (
        <div className="px-3 pb-2">
          <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-200 leading-snug">{bula.observacao}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expandable: indicação resumida + apresentação (opcional) */}
      {expanded && (
        <div className="px-3 pb-2 border-t border-[rgba(0,229,178,0.20)] pt-2 space-y-1.5">
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
              Indicação
            </p>
            <p className="text-[11px] text-slate-300 leading-snug">{bula.indicacaoResumida}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
              Apresentação ANVISA
            </p>
            <p className="text-[11px] text-slate-300 leading-snug">{bula.apresentacao}</p>
          </div>
          <div>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">
              Classe / Laboratório
            </p>
            <p className="text-[11px] text-slate-300 leading-snug">
              {bula.classeTerapeutica} · {bula.laboratorio}
            </p>
          </div>
        </div>
      )}

      {/* Footer: toggle expand + link ANVISA */}
      <div className="px-3 py-2 border-t border-[rgba(0,229,178,0.20)] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#00E5B2] transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Menos detalhes' : 'Mais detalhes'}
        </button>
        <a
          href={bula.bularioUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleBulaClick}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-semibold bg-[rgba(0,229,178,0.10)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2] hover:bg-[rgba(0,229,178,0.18)] transition-all"
          title="Abrir bula completa no portal ANVISA"
        >
          <FileText className="w-3 h-3" />
          Bula ANVISA
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  )
}

export default BulaContextPopover
