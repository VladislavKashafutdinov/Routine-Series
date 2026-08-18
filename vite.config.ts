import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Read .env from the config file's directory, not process.cwd() —
  // otherwise the dev server depends on where it was started from.
  const env = loadEnv(mode, __dirname, '')
  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8080'

  return {
    base: '/Routine-Series/',
    envDir: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
