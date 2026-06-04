import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// ── Read server.port from Spring Boot's application.properties ──────────────
// Looks for the file relative to this vite.config.js:
//   ../Backend/src/main/resources/application.properties
// Adjust PROPS_PATH if your folder layout differs.
function readSpringPort() {
  const PROPS_PATH = path.resolve(
    __dirname,
    '../Backend/src/main/resources/application.properties'
  )

  const FALLBACK = 8080

  try {
    if (!fs.existsSync(PROPS_PATH)) {
      console.warn(`[vite] application.properties not found at:\n  ${PROPS_PATH}\n  → falling back to port ${FALLBACK}`)
      return FALLBACK
    }

    const content = fs.readFileSync(PROPS_PATH, 'utf-8')

    // Match "server.port = 8083" or "server.port=8083"
    const match = content.match(/^\s*server\.port\s*=\s*(\d+)/m)

    if (!match) {
      console.warn(`[vite] server.port not found in application.properties → falling back to port ${FALLBACK}`)
      return FALLBACK
    }

    const port = parseInt(match[1], 10)
    console.log(`[vite] Proxying /api and /oauth2 → http://localhost:${port}  (read from application.properties)`)
    return port

  } catch (err) {
    console.warn(`[vite] Could not read application.properties: ${err.message} → falling back to port ${FALLBACK}`)
    return FALLBACK
  }
}

const BACKEND_PORT = readSpringPort()
const BACKEND_URL  = `http://localhost:${BACKEND_PORT}`

// ── Vite config ─────────────────────────────────────────────────────────────
export default defineConfig({
  plugins: [react()],

  define: {
    global: 'globalThis',
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.js',
  },

  server: {
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/oauth2': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/login/oauth2': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})