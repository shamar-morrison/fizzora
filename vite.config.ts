import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(three|@react-three|postprocessing|three-stdlib)\//.test(id)) return 'three'
          if (id.includes('gsap') || id.includes('lenis') || id.includes('framer-motion')) return 'motion'
        },
      },
    },
  },
})
