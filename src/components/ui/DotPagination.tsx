import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * V1.9.234 — DotPagination
 *
 * Paginação visual elegante com chevrons + dots indicadores (cinza→cyan expandido)
 * + contador. Extraída do padrão original em PatientAppointments.tsx:1690-1730
 * (cards profissionais agendamento) pra reuso em prescrições/exames/etc.
 *
 * Convenção: currentPage é 1-indexed (humano). Se o caller usa 0-indexed
 * internamente, converte:
 *   <DotPagination
 *     currentPage={partnersPage + 1}              // 0 → 1
 *     onPageChange={(p) => setPartnersPage(p - 1)} // 1 → 0
 *     ...
 *   />
 *
 * Renderiza null se totalPages <= 1 (não polui UI quando 1 página apenas).
 */

export interface DotPaginationProps {
  /** Página atual, 1-indexed (humano). Ex: 1 = primeira página. */
  currentPage: number
  /** Total de páginas (>=1). */
  totalPages: number
  /** Callback chamado com nova página 1-indexed. */
  onPageChange: (page: number) => void
  /** Classe extra opcional pra container. */
  className?: string
  /** Esconder contador "X / Y" (default mostra). */
  hideCounter?: boolean
}

const DotPagination: React.FC<DotPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  hideCounter = false,
}) => {
  if (totalPages <= 1) return null

  const safePage = Math.min(Math.max(1, currentPage), totalPages)
  const activeIndex = safePage - 1 // 0-indexed pra renderizar dots

  return (
    <div className={`flex items-center justify-center gap-3 mt-5 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, safePage - 1))}
        disabled={safePage === 1}
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPageChange(i + 1)}
            className={`h-2 rounded-full transition-all ${
              i === activeIndex
                ? 'bg-cyan-400 w-6'
                : 'bg-slate-600 hover:bg-slate-500 w-2'
            }`}
            aria-label={`Ir para página ${i + 1}`}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
        disabled={safePage === totalPages}
        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        aria-label="Próxima página"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      {!hideCounter && (
        <span className="text-xs text-slate-500 ml-2">
          {safePage} / {totalPages}
        </span>
      )}
    </div>
  )
}

export default DotPagination
