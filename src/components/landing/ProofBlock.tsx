import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PERFIL_THEME, type PerfilLanding } from './landingTheme'

interface ProofBlockProps {
  perfil: PerfilLanding
  title?: string
  subtitle?: string
  items: string[]
}

export const ProofBlock = ({ perfil, title, subtitle, items }: ProofBlockProps) => {
  const theme = PERFIL_THEME[perfil]

  return (
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-4xl">
        {(title || subtitle) && (
          <div className="text-center mb-10">
            {title && <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h2>}
            {subtitle && <p className="text-slate-400 text-base">{subtitle}</p>}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl bg-slate-800/40 backdrop-blur-md border transition-all',
                theme.border
              )}
            >
              <CheckCircle2 className={cn('w-5 h-5 flex-shrink-0 mt-0.5', theme.accent)} />
              <span className="text-slate-200 text-sm md:text-base leading-relaxed">{item}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
