import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  define: {
      global: 'globalThis',
    },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',   // optional but recommended
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
