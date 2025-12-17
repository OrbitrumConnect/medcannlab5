import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // Permite acesso de outros dispositivos na rede
    strictPort: false, // Tenta outra porta se 3000 estiver ocupada
    hmr: {
      overlay: true,
      host: 'localhost' // HMR funciona melhor com localhost
    },
    // Configurações adicionais para melhor compatibilidade
    cors: true,
    proxy: {} // Pode adicionar proxies se necessário
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
})