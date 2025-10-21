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
    },
    headers: {
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://accounts.google.com https://script.google.com https://script.googleusercontent.com https://*.googleusercontent.com https://sheets.googleapis.com https://docs.googleapis.com https://drive.googleapis.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    },
    proxy: {
      '/api': {
        target: process.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbzEOTc_GgjGz3y0ZMYSBrqc3CAXEhNBWD67ve3xTOm7mc7Y8TQMb412QIt5kO0nkEbv/exec',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 프록시 에러:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 프록시 요청:', req.method, req.url, '→', proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('📥 프록시 응답:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리
          'react-vendor': ['react', 'react-dom'],
          // Google API 관련
          'google-vendor': ['gapi-script'],
          // Papyrus DB
          'papyrus-vendor': ['papyrus-db'],
          // 기타 유틸리티
          'utils-vendor': ['rrule']
        }
      }
    },
    // 청크 크기 경고 임계값 조정 (선택사항)
    chunkSizeWarningLimit: 1000
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})