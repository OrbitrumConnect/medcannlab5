import React, { useState } from 'react'
import {
  Search,
  Loader2,
  AlertCircle,
  ExternalLink,
  Pill,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react'
import { useOpenFDA, type OpenFDAField } from '../hooks/useOpenFDA'
import type { OpenFDADrugLabel } from '../services/openfdaService'

// [V1.9.464] (27/05/2026) — Panel OpenFDA Drug Labels na aba Literatura
//
// Espelha pattern UI da ExternalLiterature.tsx V1.9.369-A (PubMed):
//   - Input busca + filtro field (brand/generic/indication/composition/all)
//   - Loading + Error + Empty states
//   - Cards de resultados com fields colapsáveis
//   - Disclaimer CFM 2.314 + ZERO síntese GPT
//
// Princípio meta aplicado: feedback_fronteira_organizar_info_farmacologica_vs_decisao_terapeutica_27_05
//   "Organizar acesso à informação oficial" — mostra bula original FDA, não interpreta.
//
// Profissional-only (Terminal Pesquisa), nunca paciente direto.

const FIELD_OPTIONS: Array<{ value: OpenFDAField; label: string; hint: string }> = [
  { value: 'all', label: 'Tudo', hint: 'busca em nome + indicação + composição' },
  { value: 'brand', label: 'Nome comercial', hint: 'Epidiolex, Sativex, etc' },
  { value: 'generic', label: 'Princípio ativo', hint: 'cannabidiol, nabiximols' },
  { value: 'indication', label: 'Indicação', hint: 'seizures, multiple sclerosis' },
  { value: 'composition', label: 'Composição', hint: 'ingrediente ativo' },
]

const OpenFDAPanel: React.FC = () => {
  const {
    term,
    setTerm,
    field,
    setField,
    loading,
    error,
    drugs,
    total,
    fromCache,
    lastSearchedTerm,
    clearSearch,
  } = useOpenFDA()

  return (
    <div className="space-y-4">
      {/* Header explicativo */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,229,178,0.10)] border border-[rgba(0,229,178,0.30)] flex items-center justify-center flex-shrink-0">
            <Pill className="w-5 h-5 text-[#00E5B2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-semibold text-white">
              OpenFDA · Drug Labels
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Bulas oficiais da <strong>U.S. FDA</strong> via API pública. Útil pra cannabinoides
              FDA-approved (Epidiolex, Sativex). Para bulas brasileiras, ANVISA está parqueada
              (aguardando trigger empírico).
            </p>
          </div>
        </div>
      </div>

      {/* Busca + filtro field */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-2 md:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar medicamento (cannabidiol, epidiolex, ...)"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-9 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#00E5B2]/60"
            />
            {term && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <select
            value={field}
            onChange={(e) => setField(e.target.value as OpenFDAField)}
            className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E5B2]/60 md:w-[180px]"
          >
            {FIELD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Termos em <strong>inglês</strong> trazem mais resultados (FDA é US). Mín. 3 caracteres.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-[#00E5B2] animate-spin mr-2" />
          <p className="text-sm text-slate-400">Buscando na OpenFDA...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-300">Erro ao buscar</p>
            <p className="text-xs text-red-200 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Empty pós-busca */}
      {!loading && !error && lastSearchedTerm && drugs.length === 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8 text-center">
          <Pill className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-300 mb-1">
            Nenhum resultado para <strong>"{lastSearchedTerm}"</strong>
          </p>
          <p className="text-xs text-slate-500">
            Tente termo em inglês ou ajuste o filtro de campo.
          </p>
        </div>
      )}

      {/* Resultados */}
      {!loading && drugs.length > 0 && (
        <div className="space-y-3">
          {/* Contador + cache indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              <strong className="text-slate-200">{drugs.length}</strong> resultado{drugs.length !== 1 ? 's' : ''}
              {total > drugs.length && (
                <span className="text-slate-500"> de ~{total.toLocaleString()} encontrados</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {fromCache && (
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">⚡ Cache</span>
              )}
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">OpenFDA / U.S. FDA</span>
            </div>
          </div>

          {/* Cards */}
          {drugs.map((drug, idx) => (
            <DrugLabelCard key={drug.id || idx} drug={drug} idx={idx} />
          ))}

          {/* Disclaimer CFM 2.314 — princípio fronteira info farmacológica */}
          <div className="bg-[rgba(0,229,178,0.06)] border border-[rgba(0,229,178,0.25)] rounded-xl p-4 mt-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00E5B2] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-[#00E5B2]">Informação educativa</strong> — bulas oficiais U.S. FDA
                via OpenFDA. <strong>Decisão clínica e prescrição: responsabilidade exclusiva do médico</strong>
                {' '}(CFM 2.314/2022 + Lei 14.063/2020). Sistema organiza acesso à informação oficial, NÃO
                participa de decisão terapêutica.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Powered by */}
      {!loading && drugs.length === 0 && !lastSearchedTerm && (
        <div className="text-center py-8">
          <Globe className="w-8 h-8 mx-auto mb-3 text-slate-600" />
          <p className="text-xs text-slate-500">
            Powered by OpenFDA · U.S. Food and Drug Administration · sem custo · sem síntese IA
          </p>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Card de 1 drug label — fields colapsáveis (expand on click)
// ────────────────────────────────────────────────────────────────────────
const DrugLabelCard: React.FC<{ drug: OpenFDADrugLabel; idx: number }> = ({ drug, idx }) => {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (yyyymmdd?: string): string => {
    if (!yyyymmdd || yyyymmdd.length !== 8) return ''
    return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(0, 4)}`
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 hover:border-[rgba(0,229,178,0.30)] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm md:text-base font-semibold text-white truncate">
            {drug.brandName}
          </h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            <span className="font-mono">{drug.genericName}</span> · {drug.manufacturer}
          </p>
          {drug.effectiveTime && (
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">
              FDA effective: {formatDate(drug.effectiveTime)}
            </p>
          )}
        </div>
        <a
          href={drug.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] text-[#00E5B2] hover:text-[#7FF2D6] transition-colors"
          title="Abrir label original na DailyMed"
        >
          DailyMed
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Indicação (sempre visível, truncada) */}
      {drug.indications && (
        <div className="mt-3">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">Indicações</p>
          <p className={`text-xs text-slate-300 leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
            {drug.indications}
          </p>
        </div>
      )}

      {/* Expandable details */}
      {expanded && (
        <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-3">
          {drug.dosage && (
            <DetailSection label="Posologia" content={drug.dosage} />
          )}
          {drug.warnings && (
            <DetailSection label="Advertências" content={drug.warnings} highlight />
          )}
          {drug.contraindications && (
            <DetailSection label="Contraindicações" content={drug.contraindications} highlight />
          )}
          {drug.adverseReactions && (
            <DetailSection label="Reações Adversas" content={drug.adverseReactions} />
          )}
          {drug.composition && (
            <DetailSection label="Composição" content={drug.composition} />
          )}
        </div>
      )}

      {/* Toggle expand */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-3 inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#00E5B2] transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-3 h-3" />
            Ocultar detalhes
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" />
            Ver bula completa (posologia, advertências, contraindicações)
          </>
        )}
      </button>
    </div>
  )
}

const DetailSection: React.FC<{ label: string; content: string; highlight?: boolean }> = ({
  label,
  content,
  highlight = false,
}) => (
  <div>
    <p className={`text-[10px] uppercase tracking-wider mb-1 font-semibold ${highlight ? 'text-amber-400' : 'text-slate-500'}`}>
      {label}
    </p>
    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
  </div>
)

export default OpenFDAPanel
