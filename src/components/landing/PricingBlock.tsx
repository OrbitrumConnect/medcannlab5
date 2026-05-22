import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { PERFIL_THEME, type PerfilLanding } from './landingTheme'

interface PricingBlockProps {
  perfil: PerfilLanding
  title: string
  subtitle?: string
  price: string
  priceUnit?: string
  priceNote?: string
  includes: string[]
  ctaLabel: string
  onCtaClick: () => void
  highlight?: string
}

export const PricingBlock = ({
  perfil,
  title,
  subtitle,
  price,
  priceUnit,
  priceNote,
  includes,
  ctaLabel,
  onCtaClick,
  highlight,
}: PricingBlockProps) => {
  const theme = PERFIL_THEME[perfil]

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className={cn(
            'bg-brand-bg rounded-2xl p-8 border relative',
            theme.border
          )}
        >
          {highlight && (
            <div className={cn(
              'absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-bold px-4 py-1 rounded-full',
              theme.button
            )}>
              {highlight}
            </div>
          )}

          <h3 className="text-2xl font-bold text-brand-text mb-2">{title}</h3>
          {subtitle && <p className="text-brand-text-muted mb-6 text-sm">{subtitle}</p>}

          <div className="mb-6 border-b border-brand-border-subtle pb-6">
            <div className="flex items-end gap-2 text-brand-text">
              <span className="text-5xl font-extrabold tracking-tight">{price}</span>
              {priceUnit && <span className="text-brand-text-muted pb-2 text-lg">{priceUnit}</span>}
            </div>
            {priceNote && <p className={cn('text-xs mt-3 font-medium', theme.text)}>{priceNote}</p>}
          </div>

          <ul className="space-y-3 mb-8">
            {includes.map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-brand-text-secondary">
                <CheckCircle2 className={cn('w-5 h-5 flex-shrink-0', theme.accent)} />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <button
            onClick={onCtaClick}
            className={cn(
              'w-full py-3 rounded-xl font-bold text-base transition-all',
              theme.button
            )}
          >
            {ctaLabel}
          </button>
        </motion.div>
      </div>
    </section>
  )
}
