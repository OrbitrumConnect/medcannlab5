import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    hmr: {
      // Garantir que o HMR funcione corretamente
      protocol: 'ws',
      host: 'localhost',
      clientPort: 8000,
      // Suprimir erros de conexão WebSocket (são comuns e não afetam a aplicação)
      overlay: false
    },
    // Suprimir avisos de WebSocket no console
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**']
    }
  },
  // Suprimir avisos de WebSocket no console do cliente
  logLevel: 'warn',
  optimizeDeps: {
    include: ['@xenova/transformers']
  },
  define: {
    global: 'globalThis',
  },
  // Garantir que o Service Worker não interfira em desenvolvimento
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})