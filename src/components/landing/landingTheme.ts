export type PerfilLanding = 'paciente' | 'medico' | 'aluno'

export const PERFIL_THEME: Record<PerfilLanding, {
  label: string
  iconEmoji: string
  badge: string
  button: string
  buttonOutline: string
  text: string
  accent: string
  ring: string
  border: string
  bg: string
  iconBg: string
  glowShadow: string
  bgGradient: string
}> = {
  paciente: {
    label: 'Paciente',
    iconEmoji: '👤',
    badge: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30',
    button: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-lg hover:shadow-emerald-500/25 text-white',
    buttonOutline: 'bg-slate-800/50 border border-emerald-500/40 hover:bg-slate-800 hover:border-emerald-500/60 text-white',
    text: 'text-emerald-300',
    accent: 'text-emerald-400',
    ring: 'ring-emerald-500/40',
    border: 'border-emerald-500/30 hover:border-emerald-500/60',
    bg: 'bg-emerald-500/10',
    iconBg: 'bg-emerald-500/10',
    glowShadow: '0 0 22px rgba(0, 193, 106, 0.55)',
    bgGradient: 'from-emerald-900/20 via-green-900/10 to-transparent',
  },
  medico: {
    label: 'Médico',
    iconEmoji: '🩺',
    badge: 'bg-blue-500/10 text-blue-300 border border-blue-500/30',
    button: 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:shadow-lg hover:shadow-blue-500/25 text-white',
    buttonOutline: 'bg-slate-800/50 border border-blue-500/40 hover:bg-slate-800 hover:border-blue-500/60 text-white',
    text: 'text-blue-300',
    accent: 'text-blue-400',
    ring: 'ring-blue-500/40',
    border: 'border-blue-500/30 hover:border-blue-500/60',
    bg: 'bg-blue-500/10',
    iconBg: 'bg-blue-500/10',
    glowShadow: '0 0 22px rgba(59, 130, 246, 0.55)',
    bgGradient: 'from-blue-900/20 via-cyan-900/10 to-transparent',
  },
  aluno: {
    label: 'Aluno',
    iconEmoji: '🎓',
    badge: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    button: 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:shadow-lg hover:shadow-amber-500/25 text-white',
    buttonOutline: 'bg-slate-800/50 border border-amber-500/40 hover:bg-slate-800 hover:border-amber-500/60 text-white',
    text: 'text-amber-300',
    accent: 'text-amber-400',
    ring: 'ring-amber-500/40',
    border: 'border-amber-500/30 hover:border-amber-500/60',
    bg: 'bg-amber-500/10',
    iconBg: 'bg-amber-500/10',
    glowShadow: '0 0 22px rgba(245, 158, 11, 0.55)',
    bgGradient: 'from-amber-900/20 via-yellow-900/10 to-transparent',
  },
}

export const PERFIL_ROUTES: Record<PerfilLanding, string> = {
  paciente: '/paciente',
  medico: '/medico',
  aluno: '/aluno',
}
