// [V1.9.425] (22/05/2026) — Foundation do tema (dark/light).
//
// O quê: ThemeProvider + hook `useTheme()` + persistência em localStorage.
// O que NÃO é: UI de toggle, refactor de superfícies legacy, ativação visual
// do light mode. Isso é só a fundação — quando o designer entregar os SVGs +
// acentos light-safe, ligar o light vira só plugar surfaces opt-in nos tokens
// `brand-*`. Veja o trade-off completo no diário 22/05.
//
// **Canal ortogonal:** o atributo aplicado no <html> é `data-theme="dark|light"`,
// NÃO `class="dark"`. Isso é proposital — o Tailwind tem `darkMode: 'class'`
// configurado e ~11 superfícies usam o prefixo `dark:` (resíduo shadcn). Se eu
// botasse `class="dark"`, essas 11 surfaces ativariam suas variantes dark de
// uma vez (efeito visual desconhecido). Com `data-theme`, código legacy fica
// 100% inerte; só código novo que opta nos tokens `brand-*` responde ao toggle.
// Zero impacto visual no app de hoje.

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  toggleTheme: () => void
}

const STORAGE_KEY = 'medcannlab.theme'
const DEFAULT_THEME: Theme = 'dark'

const ThemeContext = createContext<ThemeContextValue | null>(null)

function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') return stored
    // Primeira visita — respeita preferência do SO. Polidez padrão.
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  } catch {
    // localStorage indisponível (modo privado, etc.) — segue o default.
  }
  return DEFAULT_THEME
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => resolveInitialTheme())

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore — preferência fica só em memória nesta sessão.
    }
  }, [theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme deve estar dentro de <ThemeProvider>')
  }
  return ctx
}
