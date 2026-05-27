import React from 'react'
import {
  Search,
  X,
  ExternalLink,
  Pill,
  ShieldCheck,
  AlertCircle,
  FileText,
  ArrowUpDown,
} from 'lucide-react'
import { useAnvisa } from '../hooks/useAnvisa'
import { BULARIO_CATEGORIAS, type BularioEntry } from '../data/anvisaBularioSeed'
import type { AnvisaSearchCategoria, AnvisaSortBy } from '../services/anvisaService'

const SORT_OPTIONS: Array<{ value: AnvisaSortBy; label: string }> = [
  { value: 'az', label: 'A → Z' },
  { value: 'za', label: 'Z → A' },
  { value: 'categoria', label: 'Categoria (cannabis 1º)' },
  { value: 'tarja', label: 'Tarja (controle 1º)' },
  { value: 'relevance', label: '★ Relevância (só com busca)' },
]

// [V1.9.465] (27/05/2026) — Panel ANVISA Bulário BR (catálogo MVP)
//
// MVP-Catálogo: lista ~42 bulas top BR + link bulário ANVISA oficial.
// Princípio fronteira info farmacológica aplicado integralmente:
//   ✅ ZERO conteúdo bula armazenado
//   ✅ Link "Ver bula completa" abre ANVISA externa
//   ✅ Disclaimer CFM 2.314 obrigatório
//   ✅ Profissional-only
//
// Fase 2-Pleno (crawler + OCR cron) parqueada — desparquear quando trigger empírico
// materializar (Ricardo bater "preciso bula Y" / Marco 2 / etc).

const AnvisaPanel: React.FC = () => {
  const {
    term,
    setTerm,
    categoria,
    setCategoria,
    sortBy,
    setSortBy,
    entries,
    total,
    seedTotal,
    clearSearch,
  } = useAnvisa()

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
              Bulário BR · Catálogo
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Top <strong>{seedTotal}</strong> medicamentos relevantes pra contexto cannabis medicinal BR
              (cannabis + anti-convulsivantes + psicotrópicos + analgésicos + nefro). Cada entrada
              tem link pro <strong>Bulário Eletrônico ANVISA oficial</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Busca + filtros (V1.9.465-A: + dropdown sort) */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-2 md:gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar medicamento (mevatyl, canabidiol, gabapentina, fluoxetina...)"
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
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as AnvisaSearchCategoria)}
            className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E5B2]/60 md:w-[230px]"
            title="Filtrar por categoria"
          >
            {BULARIO_CATEGORIAS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="relative md:w-[200px]">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as AnvisaSortBy)}
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E5B2]/60"
              title="Ordenar"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Busca por nome comercial, princípio ativo, classe terapêutica ou laboratório.
          Catálogo curado · Top {seedTotal} bulas BR.
        </p>
      </div>

      {/* Empty */}
      {entries.length === 0 && (
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-8 text-center">
          <Pill className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-300 mb-1">
            Nenhum resultado{term && (<> para <strong>"{term}"</strong></>)}
          </p>
          <p className="text-xs text-slate-500 mb-3">
            Catálogo MVP atual: {seedTotal} bulas. Bula faltante? Use o portal{' '}
            <a
              href="https://consultas.anvisa.gov.br/#/bulario/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00E5B2] hover:underline"
            >
              ANVISA Bulário Eletrônico
            </a>{' '}
            direto.
          </p>
        </div>
      )}

      {/* Resultados */}
      {entries.length > 0 && (
        <div className="space-y-3">
          {/* Contador */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              <strong className="text-slate-200">{entries.length}</strong> resultado{entries.length !== 1 ? 's' : ''}
              {total > entries.length && (
                <span className="text-slate-500"> de {total} encontrados</span>
              )}
              <span className="text-slate-600"> · catálogo {seedTotal} bulas</span>
            </span>
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">ANVISA / Bulário Eletrônico BR</span>
          </div>

          {/* Cards — V1.9.465-A grid responsivo 1/2/3/4 colunas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {entries.map((entry) => (
              <BulaCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Disclaimer CFM 2.314 — princípio fronteira info farmacológica */}
          <div className="bg-[rgba(0,229,178,0.06)] border border-[rgba(0,229,178,0.25)] rounded-xl p-4 mt-4">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00E5B2] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong className="text-[#00E5B2]">Informação educativa</strong> — catálogo curado
                de metadados. <strong>Bula completa oficial está na ANVISA</strong> (clique
                "Ver bula completa"). <strong>Decisão clínica e prescrição: responsabilidade exclusiva do médico</strong>
                {' '}(CFM 2.314/2022 + Lei 14.063/2020). Sistema organiza acesso à informação oficial,
                NÃO participa de decisão terapêutica.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────
// Card de 1 bula — metadados + links pra bula original
// ────────────────────────────────────────────────────────────────────────

const TARJA_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  branca: { bg: 'bg-slate-700/40', border: 'border-slate-500/40', text: 'text-slate-300', label: 'Tarja Branca' },
  amarela: { bg: 'bg-amber-500/15', border: 'border-amber-500/40', text: 'text-amber-300', label: 'Tarja Amarela · Controle A2' },
  vermelha: { bg: 'bg-red-500/15', border: 'border-red-500/40', text: 'text-red-300', label: 'Tarja Vermelha · Retenção receita' },
  preta: { bg: 'bg-black/40', border: 'border-purple-500/40', text: 'text-purple-300', label: 'Tarja Preta · Controle Especial' },
}

const CATEGORIA_ICONS: Record<string, string> = {
  cannabis: '🌿',
  anticonvulsivante: '⚡',
  psicotropico: '🧠',
  analgesico: '💊',
  nefro: '🫘',
  outros: '📋',
}

const BulaCard: React.FC<{ entry: BularioEntry }> = ({ entry }) => {
  const tarjaCfg = entry.tarja ? TARJA_COLORS[entry.tarja] : null

  // V1.9.465-A — card compacto pra grid 4 colunas (densidade alta)
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 hover:border-[rgba(0,229,178,0.30)] transition-colors flex flex-col h-full">
      {/* Header com icon categoria + nome + tarja */}
      <div className="flex items-start gap-1.5 mb-1.5">
        <span className="text-sm flex-shrink-0 mt-0.5" aria-hidden="true">
          {CATEGORIA_ICONS[entry.categoria]}
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white leading-tight truncate" title={entry.nomeComercial}>
            {entry.nomeComercial}
          </h4>
          <p
            className="text-[10px] font-mono text-[#00E5B2]/80 truncate mt-0.5"
            title={entry.principioAtivo}
          >
            {entry.principioAtivo}
          </p>
        </div>
        {tarjaCfg && (
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border flex-shrink-0 ${tarjaCfg.bg} ${tarjaCfg.border} ${tarjaCfg.text}`}
            title={tarjaCfg.label}
          >
            {entry.tarja}
          </span>
        )}
      </div>

      {/* Classe + Lab inline (mais compacto) */}
      <p className="text-[10px] text-slate-500 truncate mb-2" title={`${entry.classeTerapeutica} · ${entry.laboratorio}`}>
        {entry.classeTerapeutica}
      </p>

      {/* Indicação resumida (truncada 2 linhas) */}
      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mb-2" title={entry.indicacaoResumida}>
        {entry.indicacaoResumida}
      </p>

      {/* Apresentação resumida (1 linha truncada) */}
      <p className="text-[10px] text-slate-400 truncate mb-2" title={entry.apresentacao}>
        <span className="text-slate-500 uppercase tracking-wider font-semibold mr-1">Form:</span>
        {entry.apresentacao}
      </p>

      {/* Observação clínica (collapse 1 linha truncada) */}
      {entry.observacao && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded p-1.5 mb-2 mt-auto">
          <div className="flex items-start gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
            <p
              className="text-[10px] text-amber-200 leading-snug line-clamp-2"
              title={entry.observacao}
            >
              {entry.observacao}
            </p>
          </div>
        </div>
      )}

      {/* Footer fixo embaixo (mt-auto se não tem observacao) */}
      <div className={`flex items-center gap-2 pt-2 border-t border-slate-700/50 ${!entry.observacao ? 'mt-auto' : ''}`}>
        <a
          href={entry.bularioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-semibold bg-[rgba(0,229,178,0.10)] border border-[rgba(0,229,178,0.45)] text-[#00E5B2] hover:bg-[rgba(0,229,178,0.18)] transition-all"
          title="Abrir bula completa no portal ANVISA"
        >
          <FileText className="w-3 h-3" />
          Bula ANVISA
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
        {entry.dailymedUrl && (
          <a
            href={entry.dailymedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-[10px] text-slate-400 hover:text-[#7FF2D6] hover:bg-slate-700/40 transition-all"
            title="Equivalente FDA (DailyMed)"
          >
            FDA
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  )
}

export default AnvisaPanel
