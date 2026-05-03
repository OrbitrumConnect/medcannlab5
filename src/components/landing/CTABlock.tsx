import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PERFIL_THEME, type PerfilLanding } from './landingTheme'

interface CTABlockProps {
  perfil: PerfilLanding
  title: string
  subtitle?: string
  ctaLabel: string
  onCtaClick: () => void
  ctaSecondaryLabel?: string
  onCtaSecondaryClick?: () => void
}

export const CTABlock = ({
  perfil,
  title,
  subtitle,
  ctaLabel,
  onCtaClick,
  ctaSecondaryLabel,
  onCtaSecondaryClick,
}: CTABlockProps) => {
  const theme = PERFIL_THEME[perfil]

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className={cn(
            'bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 md:p-12 border text-center',
            theme.border
          )}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{title}</h2>
          {subtitle && <p className="text-slate-400 text-base md:text-lg mb-8 max-w-2xl mx-auto">{subtitle}</p>}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onCtaClick}
              className={cn(
                'w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 group transition-all',
                theme.button
              )}
            >
              <span>{ctaLabel}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {ctaSecondaryLabel && onCtaSecondaryClick && (
              <button
                onClick={onCtaSecondaryClick}
                className={cn(
                  'w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg backdrop-blur-sm transition-all',
                  theme.buttonOutline
                )}
              >
                {ctaSecondaryLabel}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
