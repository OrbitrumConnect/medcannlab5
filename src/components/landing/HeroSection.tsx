import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PERFIL_THEME, type PerfilLanding } from './landingTheme'

interface HeroSectionProps {
  perfil: PerfilLanding
  badge?: string
  headline: string
  subhead: string
  ctaPrimary: { label: string; onClick: () => void }
  ctaSecondary?: { label: string; onClick: () => void }
  showNoaPhoto?: boolean
}

export const HeroSection = ({
  perfil,
  badge,
  headline,
  subhead,
  ctaPrimary,
  ctaSecondary,
  showNoaPhoto = true,
}: HeroSectionProps) => {
  const theme = PERFIL_THEME[perfil]
  const noaPhotoSrc = `${import.meta.env.BASE_URL}AvatarsEstatico.png`
  const noaAvatarSrc = `${import.meta.env.BASE_URL}noa-avatar.png`

  return (
    <section className="relative pt-12 pb-20 overflow-hidden">
      <div
        className={cn(
          'absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b blur-3xl -z-10',
          theme.bgGradient
        )}
      />

      <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-3/5 text-center lg:text-left"
        >
          {badge && (
            <div
              className={cn(
                'inline-flex items-center space-x-2 rounded-full px-4 py-1.5 mb-6',
                theme.badge
              )}
            >
              <span className="text-base">{theme.iconEmoji}</span>
              <span className="text-xs font-semibold uppercase tracking-wider">{badge}</span>
            </div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight tracking-tight text-white">
            {headline}
          </h1>

          <p className="text-base md:text-lg text-slate-300 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
            {subhead}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <button
              onClick={ctaPrimary.onClick}
              className={cn(
                'w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 group transition-all',
                theme.button
              )}
            >
              <span>{ctaPrimary.label}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {ctaSecondary && (
              <button
                onClick={ctaSecondary.onClick}
                className={cn(
                  'w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg backdrop-blur-sm transition-all',
                  theme.buttonOutline
                )}
              >
                {ctaSecondary.label}
              </button>
            )}
          </div>
        </motion.div>

        {showNoaPhoto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:w-2/5 flex items-center justify-center"
          >
            <div
              className={cn(
                'relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-2',
                theme.border.split(' ')[0]
              )}
              style={{ boxShadow: theme.glowShadow }}
            >
              <img
                src={noaPhotoSrc}
                alt="Nôa Esperanza — IA Residente da MedCannLab"
                className="w-full h-full object-cover"
                onError={e => {
                  e.currentTarget.src = noaAvatarSrc
                }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  )
}
