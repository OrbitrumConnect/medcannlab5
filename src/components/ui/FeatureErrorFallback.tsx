import React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/**
 * Fallback compacto para ErrorBoundary em nível de FEATURE
 * (não a tela inteira). V1.9.205 — Tier S hardening.
 *
 * O ErrorBoundary global (src/components/ErrorBoundary.tsx) renderiza
 * min-h-screen quando crash — bom pra app-level mas ruim pra crash de
 * feature isolada (deixaria PatientNFTGallery ocupando tela inteira).
 *
 * Este fallback fica DENTRO do dashboard, não substitui a navegação.
 *
 * Uso:
 *   <ErrorBoundary fallback={<FeatureErrorFallback name="Galeria" />}>
 *     <Suspense fallback={<DashboardSectionSkeleton ... />}>
 *       <PatientNFTGallery ... />
 *     </Suspense>
 *   </ErrorBoundary>
 */

interface Props {
    name: string
    onRetry?: () => void
}

export const FeatureErrorFallback: React.FC<Props> = ({ name, onRetry }) => {
    const handleRetry = () => {
        if (onRetry) onRetry()
        else window.location.reload()
    }

    return (
        <div
            className="rounded-2xl p-6 border flex flex-col items-center text-center gap-3"
            style={{
                background: 'rgba(15, 36, 60, 0.4)',
                borderColor: 'rgba(239, 68, 68, 0.25)'
            }}
            role="alert"
        >
            <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
                <h3 className="text-base font-semibold text-brand-text mb-1">
                    Não foi possível carregar {name}
                </h3>
                <p className="text-sm text-brand-text-muted max-w-md">
                    Houve uma falha ao carregar esta seção. As outras áreas do dashboard
                    continuam funcionando normalmente.
                </p>
            </div>
            <button
                onClick={handleRetry}
                className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-brand-surface hover:bg-brand-surface-subtle text-slate-200 border border-brand-border transition-colors"
            >
                <RotateCcw className="w-4 h-4" />
                Tentar novamente
            </button>
        </div>
    )
}

export default FeatureErrorFallback
