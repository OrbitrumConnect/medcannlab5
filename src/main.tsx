import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './lib/i18n' // Import i18n configuration
import './styles/mobile-responsive.css'

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
