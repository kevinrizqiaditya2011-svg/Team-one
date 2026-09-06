import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // App besar (Firebase + chart) — naikkan ambang warning agar build tidak
  // terus menampilkan peringatan chunk > 500 kB.
  build: {
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    // Proxy API ke Laravel — browser hanya bicara ke localhost:5173 (same-origin),
    // sehingga cookie sesi Laravel tetap terkirim (localhost vs 127.0.0.1 dianggap
    // cross-site oleh browser dan cookie SameSite=Lax tidak ikut).
    // changeOrigin: false → Host tetap localhost:5173, cookie sesi disimpan untuk localhost.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: false,
      },
    },
  },
})
