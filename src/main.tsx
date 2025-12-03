import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './styles/mobile-responsive.css'

// Suprimir erros inofensivos do MetaMask quando a extensão não está disponível
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    // Suprimir erros específicos do MetaMask que são inofensivos
    if (
      event.reason?.message?.includes('MetaMask extension not found') ||
      event.reason?.message?.includes('Failed to connect to MetaMask') ||
      event.reason?.stack?.includes('inpage.js')
    ) {
      event.preventDefault()
      // Não fazer nada - erro é inofensivo
      return
    }
  })

  // Também capturar erros no console se necessário
  const originalError = console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    // Suprimir apenas erros específicos do MetaMask
    if (
      message.includes('MetaMask extension not found') ||
      message.includes('Failed to connect to MetaMask') ||
      message.includes('inpage.js')
    ) {
      return // Não exibir no console
    }
    // Suprimir erros de WebSocket do Vite (são comuns e não afetam a aplicação)
    if (
      message.includes('WebSocket connection') ||
      message.includes('WebSocket closed') ||
      message.includes('[vite] failed to connect to websocket') ||
      message.includes('WebSocket closed without opened')
    ) {
      return // Não exibir no console
    }
    originalError.apply(console, args)
  }
  
  // Suprimir avisos de WebSocket do Vite também
  const originalWarn = console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ')
    // Suprimir avisos de WebSocket do Vite
    if (
      message.includes('[vite] failed to connect to websocket') ||
      message.includes('WebSocket connection')
    ) {
      return // Não exibir no console
    }
    originalWarn.apply(console, args)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
