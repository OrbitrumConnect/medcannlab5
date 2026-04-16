import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { componentTagger } from 'lovable-tagger'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  server: {
    port: 3000,
    host: '0.0.0.0', 
    strictPort: true, 
    hmr: {
      overlay: true,
      host: 'localhost' // HMR funciona melhor com localhost
    },
    // Configurações adicionais para melhor compatibilidade
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    include: ['@xenova/transformers'],
    force: true // Força re-otimização das dependências
  },
  define: {
    global: 'globalThis',
  },
  build: {
    // Desabilita cache de build
    rollupOptions: {
      output: {
        // Adiciona hash aos arquivos para evitar cache
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  }
}))
