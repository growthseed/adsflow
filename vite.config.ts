import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { devApiPlugin } from './src/server/vite-dev-api-plugin'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega .env.local no process.env (sem prefixo VITE_), assim os
  // handlers em api/* enxergam ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY,
  // etc. — vite normalmente só expõe VITE_* para o cliente.
  const env = loadEnv(mode, process.cwd(), '')
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v
  }

  return {
  plugins: [react(), devApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    // Se VITE_API_PROXY estiver setado, proxy /api/* para esse host (ex.:
    // `vercel dev` em outra porta). Caso contrário, vite retorna 404 para
    // endpoints /api/* — os components tratam 404/501 defensivamente com
    // mensagem clara ("integração não configurada") ao invés de spinner.
    proxy: process.env.VITE_API_PROXY
      ? {
          '/api': {
            target: process.env.VITE_API_PROXY,
            changeOrigin: true,
            secure: false,
            ws: false,
          },
        }
      : undefined,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@xyflow') || id.includes('node_modules/reactflow')) {
            return 'vendor-reactflow'
          }
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-recharts'
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase'
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion'
          }
        },
      },
    },
  },
  }
})
