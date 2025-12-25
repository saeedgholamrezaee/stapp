import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/assets/stapp/vuefront/', 
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: '/index.html', 
    },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      '/api': 'http://localhost:8000',
      '/assets': 'http://localhost:8000',
    },
  },
})
