import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'
import './lib/i18n' // Import i18n configuration
import './styles/mobile-responsive.css'

// V1.9.209 — Sentry observabilidade em produção (free tier 5k events/mês).
// Inicializa SOMENTE se VITE_SENTRY_DSN definida em env. Sem DSN = noop silencioso.
// Ativo apenas em prod (não polui dev). Princípio defense in depth (Princípio 4).
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN
if (SENTRY_DSN && import.meta.env.PROD) {
  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: import.meta.env.MODE,
      // tracesSampleRate=0 → desabilita perf monitoring (focar errors free tier)
      tracesSampleRate: 0,
      // Filtros pra não estourar quota com ruído conhecido
      beforeSend(event) {
        const msg = (event.message || event.exception?.values?.[0]?.value || '').toString()
        // Silenciar noise conhecido
        if (msg.includes('ResizeObserver loop')) return null
        if (msg.includes('Non-Error promise rejection captured')) return null
        return event
      }
    })
  } catch (err) {
    console.warn('Sentry init falhou — seguindo sem observabilidade Sentry:', err)
  }
}

// PWA: Capturar evento de instalação para uso nos botões da Landing
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPrompt = e
    console.log('✅ PWA: Install prompt capturado')
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
