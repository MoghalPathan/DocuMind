import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/query': 'http://localhost:8000',
      '/ingest': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/documents': 'http://localhost:8000',
    },
  },
})
