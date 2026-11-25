import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5176,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/silo': {
        target: 'http://127.0.0.1:9022',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/silo/, ''),
      },
      '/insulation-materials-assets': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
