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
    proxy: {
      '/api': {
        target: process.env.VITE_APP_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbwlgk6IgxezP9RpLT3Jn6Lv2JmuW1ZjTdrnx5-IyiC3MJDSv-xGb8vz1h9H0TCU9JyY/exec',
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