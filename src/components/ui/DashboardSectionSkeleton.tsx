import React from 'react'

/**
 * Skeleton uniforme para fallback de Suspense em seções pesadas do dashboard.
 * Tier A perf optimization (V1.9.x).
 *
 * Uso:
 *   <Suspense fallback={<DashboardSectionSkeleton variant="analytics" />}>
 *     <PatientAnalytics ... />
 *   </Suspense>
 */

type SkeletonVariant = 'analytics' | 'reports' | 'gallery' | 'generic'

interface Props {
    variant?: SkeletonVariant
    label?: string
}

export const DashboardSectionSkeleton: React.FC<Props> = ({ variant = 'generic', label }) => {
    const config = {
        analytics: { rows: 3, cols: 2, label: label || 'Carregando análises…' },
        reports: { rows: 4, cols: 1, label: label || 'Carregando relatórios clínicos…' },
        gallery: { rows: 2, cols: 4, label: label || 'Carregando galeria…' },
        generic: { rows: 3, cols: 1, label: label || 'Carregando…' }
    }[variant]

    return (
        <div
            className="space-y-4 animate-pulse"
            role="status"
            aria-busy="true"
            aria-live="polite"
            aria-label={config.label}
        >
            <span className="sr-only">{config.label}</span>

            {/* Header faux */}
            <div className="h-7 w-48 rounded-lg bg-slate-800/60" />

            {/* Grid */}
            <div
                className={
                    config.cols === 4
                        ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                        : config.cols === 2
                            ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                            : 'space-y-3'
                }
            >
                {Array.from({ length: config.rows * config.cols }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl bg-slate-900/40 border border-white/5 p-5"
                    >
                        <div className="h-4 w-1/3 rounded bg-slate-700/60 mb-3" />
                        <div className="h-3 w-2/3 rounded bg-slate-800/60 mb-2" />
                        <div className="h-3 w-1/2 rounded bg-slate-800/60" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default DashboardSectionSkeleton
