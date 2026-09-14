import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import { createAudiomackMiddleware } from './server/audiomack.mjs'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    tailwindcss(),
    {
      name: 'audiomack-search',
      configureServer(server) { server.middlewares.use(createAudiomackMiddleware({ ...loadEnv(mode, process.cwd(), 'AUDIOMACK_'), ...process.env })); },
      configurePreviewServer(server) { server.middlewares.use(createAudiomackMiddleware({ ...loadEnv(mode, process.cwd(), 'AUDIOMACK_'), ...process.env })); },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
}))
