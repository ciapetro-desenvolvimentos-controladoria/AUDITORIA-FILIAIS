import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Alias @/* -> src/* (padrão shadcn/ui), igual à Intranet Controladoria.
export default defineConfig({
  plugins: [react()],
  // /api vai para o backend de teste da Intranet (mesmo proxy que a Intranet usa em dev).
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
