import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { PERFIL_ROUTES, PERFIL_THEME, type PerfilLanding } from './landingTheme'

const PERFIS: PerfilLanding[] = ['paciente', 'medico', 'aluno']

export const PerfilSwitcher = ({ ativo }: { ativo?: PerfilLanding }) => {
  const location = useLocation()
  const currentPath = location.pathname

  return (
    <div className="w-full bg-slate-900/60 backdrop-blur-md border-y border-slate-800">
      <div className="container mx-auto px-6 py-2 flex items-center justify-center gap-2 md:gap-4">
        <span className="text-xs text-slate-500 hidden sm:inline">Você é:</span>
        {PERFIS.map(perfil => {
          const theme = PERFIL_THEME[perfil]
          const route = PERFIL_ROUTES[perfil]
          const isActive = ativo === perfil || currentPath === route

          return (
            <Link
              key={perfil}
              to={route}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all',
                isActive
                  ? cn(theme.badge, 'shadow-md')
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              )}
            >
              <span className="text-base">{theme.iconEmoji}</span>
              <span>Sou {theme.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
