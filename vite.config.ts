import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      strict: false
    },
    middlewareMode: false,
    hmr: {
      overlay: true
    }
  },
  build: {
    charset: 'utf8',
    rollupOptions: {
      output: {
        charset: 'utf8'
      }
    }
  },
  esbuild: {
    charset: 'utf8',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})